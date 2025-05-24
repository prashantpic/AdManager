import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';
import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';
import { ProcessRefundDto } from '../dtos';
import { SubscriptionModuleConfig } from '../config';
import { SUBSCRIPTION_CONFIG_TOKEN } from '../constants';
import { PaymentFailedException } from '../common/exceptions/payment-failed.exception';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { MerchantSubscriptionAggregate } from '../domain/aggregates/merchant-subscription.aggregate';
import { SubscriptionPaymentFailedEvent } from '../domain/events/definitions/subscription-payment-failed.event';
import { SUBSCRIPTION_PAYMENT_FAILED_EVENT, SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX } from '../constants';
// Placeholder for PaymentGatewayService and NotificationService
// import { PaymentGatewayService } from '../../integration/payment-gateway/payment-gateway.service';
// import { NotificationService } from '../../notification/notification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly config: SubscriptionModuleConfig;

  constructor(
    @Inject('IMerchantSubscriptionRepository')
    private readonly subscriptionRepository: IMerchantSubscriptionRepository,
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
    private readonly eventEmitter: EventEmitter2,
    // @Inject(PaymentGatewayService) private readonly paymentGateway: PaymentGatewayService,
    // @Inject(NotificationService) private readonly notificationService: NotificationService,
    private readonlynestjsConfigService: ConfigService, // Using NestJS's ConfigService
  ) {
    // Load typed config - assuming 'subscription' is the key in global config
    this.config = this.nestjsConfigService.get<SubscriptionModuleConfig>('subscription', { infer: true });
    if (!this.config) {
        this.logger.warn('SubscriptionModuleConfig not found. Using default values.');
        this.config = { dunningRetryAttempts: 3, prorationPolicy: 'prorated_credit_on_next_invoice' }; // Example defaults
    }
  }

  async collectSubscriptionFee(subscriptionId: string, forRenewal: boolean = false): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${subscriptionId}" not found for fee collection.`);
    }

    if (![SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(subscription.status)) {
      this.logger.warn(`Cannot collect fee for subscription ${subscriptionId} in status ${subscription.status}.`);
      return false;
    }

    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) {
      throw new NotFoundException(`Plan ${subscription.planId} for subscription ${subscriptionId} not found.`);
    }

    const pricingTier = plan.pricingTiers.find(p => p.cycle === subscription.billingCycle);
    if (!pricingTier) {
      this.logger.error(`Pricing tier for cycle ${subscription.billingCycle} not found on plan ${plan.id}.`);
      await this.handlePaymentProcessingFailure(subscription, 'Internal configuration error: pricing tier not found.');
      return false;
    }

    const amountToCharge = pricingTier.amount;
    const currency = pricingTier.currency;

    try {
      this.logger.log(`Attempting to charge ${amountToCharge} ${currency} for subscription ${subscriptionId}.`);
      // const paymentResult = await this.paymentGateway.charge({
      //   merchantId: subscription.merchantId,
      //   paymentMethodToken: subscription.billingInfo.paymentMethodToken, // Assuming billingInfo is always present for active/past_due
      //   amount: amountToCharge,
      //   currency: currency,
      //   description: `Subscription fee for ${plan.name} (${subscription.billingCycle})`,
      //   subscriptionId: subscription.id,
      // });

      // Simulate payment gateway call
      const paymentSuccessful = Math.random() > 0.1; // 90% success rate for simulation
      const paymentResult = paymentSuccessful
        ? { success: true, transactionId: `txn_${Date.now()}` }
        : { success: false, reason: 'Simulated payment decline', errorCode: 'DECLINED' };


      if (paymentResult.success) {
        this.logger.log(`Payment successful for subscription ${subscriptionId}. Txn ID: ${paymentResult.transactionId}`);
        subscription.recordPaymentSuccess(amountToCharge, currency, paymentResult.transactionId, new Date());
        if (forRenewal) {
            subscription.renew(new Date()); // Aggregate advances period
        }
        subscription.reactivate(); // Resets dunning, sets to ACTIVE

        await this.subscriptionRepository.save(subscription);
        subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
        return true;
      } else {
        this.logger.warn(`Payment failed for subscription ${subscriptionId}. Reason: ${paymentResult.reason}`);
        await this.handlePaymentProcessingFailure(subscription, paymentResult.reason || 'Payment declined by gateway.');
        return false;
      }
    } catch (error) {
      this.logger.error(`Error during payment collection for subscription ${subscriptionId}:`, error);
      await this.handlePaymentProcessingFailure(subscription, `Payment gateway communication error: ${error.message}`);
      // Do not re-throw PaymentFailedException here, as handlePaymentProcessingFailure does the job.
      return false; // Indicate failure
    }
  }

  private async handlePaymentProcessingFailure(subscription: MerchantSubscriptionAggregate, reason: string): Promise<void> {
      subscription.processFailedPayment(reason, new Date()); // Aggregate updates status, dunning state
      await this.subscriptionRepository.save(subscription);

      // Emit payment failed event, which is handled by PaymentEventsListener -> this.handleFailedPayment (dunning logic)
      this.eventEmitter.emit(
          SUBSCRIPTION_PAYMENT_FAILED_EVENT,
          new SubscriptionPaymentFailedEvent(subscription.id, subscription.merchantId, subscription.dunningAttempts, reason)
      );

      // Emit specific status change events if aggregate doesn't
      subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
  }


  async processRefund(dto: ProcessRefundDto): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(dto.subscriptionId);
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${dto.subscriptionId}" not found for refund.`);
    }

    // Determine amount and transaction to refund
    let amountToRefund = dto.amount;
    let transactionIdToRefund = dto.gatewayTransactionId;

    if (!transactionIdToRefund) {
        const lastSuccessfulCharge = subscription.paymentHistory
            .filter(p => p.status === 'success' && p.type === 'charge')
            .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

        if (!lastSuccessfulCharge) {
            throw new BadRequestException(`No refundable charge found for subscription ${dto.subscriptionId}.`);
        }
        transactionIdToRefund = lastSuccessfulCharge.gatewayTransactionId;
        if (!amountToRefund) amountToRefund = lastSuccessfulCharge.amount; // Refund full amount of last charge if not specified
    }
    if (!amountToRefund) { // Still no amount, e.g. if specific transaction ID was given but no amount
        throw new BadRequestException('Refund amount must be specified or determinable from last transaction.');
    }


    try {
      this.logger.log(`Processing refund of ${amountToRefund} for subscription ${subscriptionId}, transaction ${transactionIdToRefund}.`);
      // const refundResult = await this.paymentGateway.refund({
      //   transactionId: transactionIdToRefund,
      //   amount: amountToRefund,
      //   reason: dto.reason,
      //   subscriptionId: subscription.id,
      // });

      // Simulate refund
      const refundResult = { success: true, refundId: `ref_${Date.now()}` };

      if (refundResult.success) {
        this.logger.log(`Refund successful for subscription ${subscriptionId}. Refund ID: ${refundResult.refundId}`);
        subscription.recordRefund(amountToRefund, transactionIdToRefund, refundResult.refundId, dto.reason, new Date());
        await this.subscriptionRepository.save(subscription);
        // await this.notificationService.sendRefundConfirmation(subscription.merchantId, amountToRefund, dto.reason);
        subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
      } else {
        this.logger.error(`Refund failed for subscription ${subscriptionId}. Reason: ${refundResult.reason}`);
        throw new PaymentFailedException(`Refund failed: ${refundResult.reason}`);
      }
    } catch (error) {
      this.logger.error(`Error processing refund for subscription ${subscriptionId}:`, error);
      throw new PaymentFailedException(`Refund processing error: ${error.message}`);
    }
  }

  // This is the dunning logic handler, called by PaymentEventsListener
  async handleFailedPayment(subscriptionId: string, failureReason: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      this.logger.warn(`handleFailedPayment called for non-existent subscription: ${subscriptionId}`);
      return;
    }

    this.logger.log(`Handling failed payment for subscription ${subscriptionId}. Current attempts: ${subscription.dunningAttempts}. Reason: ${failureReason}`);

    // Dunning policy: max attempts, suspension, termination
    // The aggregate's processFailedPayment method already updated attempts and potentially status.
    // Here, we decide on next actions like notifications or further escalations if not handled by aggregate state machine.

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      // await this.notificationService.sendPaymentFailedNotification(subscription.merchantId, failureReason, subscription.dunningAttempts);
      this.logger.log(`Sent dunning notification for PAST_DUE subscription ${subscriptionId}, attempt ${subscription.dunningAttempts}.`);
    }

    if (subscription.dunningAttempts >= this.config.dunningRetryAttempts && subscription.status !== SubscriptionStatus.SUSPENDED && subscription.status !== SubscriptionStatus.TERMINATED) {
        this.logger.log(`Dunning attempts exhausted for subscription ${subscriptionId}. Suspending.`);
        subscription.suspend(new Date()); // Suspend if max retries reached and not already suspended/terminated
        // await this.notificationService.sendSubscriptionSuspendedNotification(subscription.merchantId);
    } else if (subscription.status === SubscriptionStatus.SUSPENDED) {
        // Check if suspended long enough for termination
        const daysSuspended = (new Date().getTime() - (subscription.lastStatusChangeDate?.getTime() || new Date().getTime())) / (1000 * 60 * 60 * 24);
        if (daysSuspended >= (this.config.terminationAfterDaysSuspended || 14) ) { // Default 14 days
            this.logger.log(`Subscription ${subscriptionId} suspended for ${daysSuspended} days. Terminating.`);
            subscription.terminate(new Date());
            // await this.notificationService.sendSubscriptionTerminatedNotification(subscription.merchantId);
        }
    }

    await this.subscriptionRepository.save(subscription);
    subscription.pullEvents().forEach(event => this.eventEmitter.emit(event.name, event));
  }

  // Called by SubscriptionRenewalJob
  async processRenewals(): Promise<void> {
    this.logger.log('Processing subscription renewals...');
    const subscriptionsToRenew = await this.subscriptionRepository.findDueForRenewal(new Date());

    if (subscriptionsToRenew.length === 0) {
        this.logger.log('No subscriptions due for renewal.');
        return;
    }
    this.logger.log(`Found ${subscriptionsToRenew.length} subscriptions for renewal.`);

    for (const subscription of subscriptionsToRenew) {
      this.logger.log(`Processing renewal for subscription ${subscription.id}.`);
      // collectSubscriptionFee will handle payment and subsequent state changes/events.
      await this.collectSubscriptionFee(subscription.id, true);
    }
    this.logger.log('Finished processing renewals.');
  }
}