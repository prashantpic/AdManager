import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';
import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';
import { ManageMerchantSubscriptionDto } from '../dtos';
import { MerchantSubscriptionAggregate } from '../domain/aggregates/merchant-subscription.aggregate';
import { PlanNotFoundException } from '../common/exceptions/plan-not-found.exception';
import { ProrationCalculatorDomainService } from '../domain/services/proration-calculator.domain-service';
import { BillingDetailsVO } from '../domain/value-objects/billing-details.vo';
import { BillingCycle } from '../common/enums/billing-cycle.enum';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { MERCHANT_SUBSCRIBED_EVENT, SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX } from '../constants';
import { MerchantSubscribedEvent } from '../domain/events/definitions/merchant-subscribed.event';
import { SubscriptionDomainException } from '../common/exceptions/subscription-domain.exception';
import { v4 as uuidv4 } from 'uuid';
// Assume PaymentGatewayService and NotificationService are injected if direct calls are needed
// For event-driven approach, those services would listen to events.

@Injectable()
export class MerchantSubscriptionService {
  private readonly logger = new Logger(MerchantSubscriptionService.name);

  constructor(
    @Inject('IMerchantSubscriptionRepository')
    private readonly subscriptionRepository: IMerchantSubscriptionRepository,
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
    private readonly prorationCalculator: ProrationCalculatorDomainService,
    private readonly eventEmitter: EventEmitter2,
    // private readonly paymentGatewayService: PaymentGatewayService, // For direct payment collection
  ) {}

  async subscribeMerchant(merchantId: string, dto: ManageMerchantSubscriptionDto): Promise<MerchantSubscriptionAggregate> {
    const existingSubscription = await this.subscriptionRepository.findByMerchantId(merchantId);
    if (existingSubscription && [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.PENDING, SubscriptionStatus.SUSPENDED].includes(existingSubscription.status)) {
      throw new BadRequestException(`Merchant ${merchantId} already has an active or non-terminated subscription.`);
    }

    const plan = await this.planRepository.findById(dto.planId);
    if (!plan) {
      throw new PlanNotFoundException(dto.planId);
    }

    if (!dto.paymentMethodToken) {
        throw new BadRequestException('Payment method token is required for new subscriptions.');
    }

    const billingCycle = dto.billingCycle || plan.pricingTiers[0]?.cycle || BillingCycle.MONTHLY; // Default or from plan
    const pricingTier = plan.pricingTiers.find(p => p.cycle === billingCycle);
    if (!pricingTier) {
      throw new BadRequestException(`Plan ${dto.planId} does not offer billing cycle ${billingCycle}.`);
    }

    const billingInfo = new BillingDetailsVO(dto.paymentMethodToken, '', ''); // Address/email might come from merchant profile

    // Initial payment collection (simplified)
    // const initialChargeAmount = pricingTier.amount;
    // try {
    //   await this.paymentGatewayService.charge(merchantId, dto.paymentMethodToken, initialChargeAmount, pricingTier.currency, `Initial charge for ${plan.name}`);
    // } catch (paymentError) {
    //   this.logger.error(`Initial payment failed for merchant ${merchantId}, plan ${plan.id}`, paymentError);
    //   throw new PaymentFailedException('Initial subscription payment failed.', paymentError);
    // }
    // If payment fails, subscription might be created in PENDING state or not at all.
    // For this design, assume payment is handled, and subscription becomes ACTIVE.

    const subscription = MerchantSubscriptionAggregate.subscribe(
      uuidv4(),
      merchantId,
      plan.id,
      billingInfo,
      billingCycle,
    );

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Merchant ${merchantId} subscribed to plan ${plan.id}. Subscription ID: ${subscription.id}`);

    // Emit domain events from aggregate
    subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));

    return subscription;
  }

  async changeMerchantPlan(subscriptionId: string, merchantId: string, dto: ManageMerchantSubscriptionDto): Promise<MerchantSubscriptionAggregate> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${subscriptionId}" not found.`);
    }
    if (subscription.merchantId !== merchantId) {
        throw new BadRequestException('Subscription does not belong to the authenticated merchant.');
    }

    const newPlan = await this.planRepository.findById(dto.planId);
    if (!newPlan) {
      throw new PlanNotFoundException(dto.planId);
    }

    if (subscription.planId === newPlan.id && (!dto.billingCycle || subscription.billingCycle === dto.billingCycle)) {
        this.logger.log(`No change requested for subscription ${subscriptionId}.`);
        return subscription; // No change
    }

    const oldPlan = await this.planRepository.findById(subscription.planId);
    if (!oldPlan) {
        throw new SubscriptionDomainException(`Critical error: Old plan ${subscription.planId} for subscription ${subscriptionId} not found.`);
    }

    // Calculate proration
    const prorationAmount = this.prorationCalculator.calculateProration(subscription, oldPlan, newPlan, new Date());
    this.logger.log(`Proration for subscription ${subscriptionId} change to plan ${newPlan.id}: ${prorationAmount}`);

    // Collect/refund proration amount via BillingService or PaymentGatewayService
    // if (prorationAmount > 0) {
    //   await this.paymentGatewayService.charge(...);
    // } else if (prorationAmount < 0) {
    //   await this.paymentGatewayService.refund(...);
    // }

    const newBillingCycle = dto.billingCycle || subscription.billingCycle; // Keep old cycle if not specified
    subscription.changePlan(newPlan.id, newBillingCycle, prorationAmount, new Date()); // Aggregate handles state, period updates

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Subscription ${subscriptionId} changed to plan ${newPlan.id}, cycle ${newBillingCycle}.`);

    subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
    // Emit a specific plan changed event for external listeners if aggregate doesn't
    this.eventEmitter.emit(`${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.plan_changed`, {
        subscriptionId: subscription.id, merchantId: subscription.merchantId, oldPlanId: oldPlan.id, newPlanId: newPlan.id, prorationAmount
    });


    return subscription;
  }

  async cancelSubscription(subscriptionId: string, merchantId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${subscriptionId}" not found.`);
    }
     if (subscription.merchantId !== merchantId) {
        throw new BadRequestException('Subscription does not belong to the authenticated merchant.');
    }

    subscription.cancel(new Date()); // Aggregate handles state, endDate

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Subscription ${subscriptionId} cancelled.`);

    subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
  }

  async getSubscriptionByMerchantId(merchantId: string): Promise<MerchantSubscriptionAggregate | null> {
    const subscription = await this.subscriptionRepository.findByMerchantId(merchantId);
    if (!subscription) {
        this.logger.warn(`No subscription found for merchant ID ${merchantId}.`);
        return null;
    }
    return subscription;
  }

  async getSubscriptionById(subscriptionId: string): Promise<MerchantSubscriptionAggregate | null> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
     if (!subscription) {
        this.logger.warn(`No subscription found for ID ${subscriptionId}.`);
        return null;
    }
    return subscription;
  }
}