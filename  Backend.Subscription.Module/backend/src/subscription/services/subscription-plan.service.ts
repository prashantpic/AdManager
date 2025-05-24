import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dtos';
import { SubscriptionPlanAggregate } from '../domain/aggregates/subscription-plan.aggregate';
import { PlanNotFoundException } from '../common/exceptions/plan-not-found.exception';
import { PlanPriceChangedEvent } from '../domain/events/definitions/plan-price-changed.event';
import { PricingVO } from '../domain/value-objects/pricing.vo';
import { SubscriptionFeatureVO } from '../domain/value-objects/subscription-feature.vo';
import { UsageLimitVO } from '../domain/value-objects/usage-limit.vo';
import { PLAN_PRICE_CHANGED_EVENT } from '../constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionPlanService {
  private readonly logger = new Logger(SubscriptionPlanService.name);

  constructor(
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanAggregate> {
    const pricingTiers = dto.pricingTiers.map(p => new PricingVO(p.amount, p.currency, p.cycle));
    const features = dto.features.map(f => new SubscriptionFeatureVO(f.name, f.description));
    const usageLimits = dto.usageLimits.map(u => new UsageLimitVO(u.featureKey, u.limit, u.unit));

    const plan = SubscriptionPlanAggregate.create(
      uuidv4(),
      dto.name,
      dto.type,
      pricingTiers,
      features,
      usageLimits,
      dto.supportLevel,
    );

    await this.planRepository.save(plan);
    this.logger.log(`Subscription plan created: ${plan.id} - ${plan.name}`);
    // No domain events emitted from aggregate on creation in this model, handled by service if needed
    return plan;
  }

  async updatePlan(planId: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanAggregate> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new PlanNotFoundException(planId);
    }

    const oldPricingTiers = [...plan.pricingTiers]; // For event

    plan.updateDetails({
        name: dto.name,
        type: dto.type,
        features: dto.features?.map(f => new SubscriptionFeatureVO(f.name, f.description)),
        usageLimits: dto.usageLimits?.map(u => new UsageLimitVO(u.featureKey, u.limit, u.unit)),
        supportLevel: dto.supportLevel,
    });

    if (dto.pricingTiers) {
        plan.updatePrice(dto.pricingTiers.map(p => new PricingVO(p.amount, p.currency, p.cycle)));
    }

    await this.planRepository.save(plan);
    this.logger.log(`Subscription plan updated: ${plan.id}`);

    // Emit events pulled from aggregate
    plan.pullEvents().forEach(event => {
      if (event instanceof PlanPriceChangedEvent) {
        // Ensure old pricing is correctly captured for the event if it's emitted from aggregate
        this.eventEmitter.emit(PLAN_PRICE_CHANGED_EVENT, new PlanPriceChangedEvent(plan.id, oldPricingTiers, plan.pricingTiers));
        this.logger.log(`Event ${PLAN_PRICE_CHANGED_EVENT} emitted for plan ${plan.id}`);
      } else {
        this.eventEmitter.emit(event.name, event); // For other potential events
      }
    });

    return plan;
  }

  async getPlanById(planId: string): Promise<SubscriptionPlanAggregate | null> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
        this.logger.warn(`Subscription plan with ID ${planId} not found.`);
        return null;
    }
    return plan;
  }

  async getAllPlans(): Promise<SubscriptionPlanAggregate[]> {
    return this.planRepository.findAll();
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new PlanNotFoundException(planId);
    }
    // Add validation: check if plan is in use by any active subscriptions
    // e.g., const activeSubscriptions = await this.merchantSubscriptionRepository.findByPlanIdAndStatus(planId, SubscriptionStatus.ACTIVE);
    // if (activeSubscriptions.length > 0) {
    //   throw new SubscriptionDomainException('Cannot delete plan: It is currently in use by active subscriptions.');
    // }
    await this.planRepository.delete(planId);
    this.logger.log(`Subscription plan deleted: ${planId}`);
    // Optionally emit PlanDeletedEvent
  }

  // This method might be redundant if updatePlan covers price changes.
  // However, if there are specific workflows only for price changes, it's useful.
  async changePlanPrice(planId: string, newPricingDtos: { amount: number; currency: string; cycle: import('../common/enums/billing-cycle.enum').BillingCycle }[]): Promise<SubscriptionPlanAggregate> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new PlanNotFoundException(planId);
    }

    const oldPricing = [...plan.pricingTiers];
    const newPricingVOs = newPricingDtos.map(p => new PricingVO(p.amount, p.currency, p.cycle));
    plan.updatePrice(newPricingVOs); // This should emit PlanPriceChangedEvent from aggregate

    await this.planRepository.save(plan);
    this.logger.log(`Price changed for subscription plan: ${plan.id}`);

    plan.pullEvents().forEach(event => {
        if (event instanceof PlanPriceChangedEvent) {
            this.eventEmitter.emit(PLAN_PRICE_CHANGED_EVENT, new PlanPriceChangedEvent(plan.id, oldPricing, plan.pricingTiers));
             this.logger.log(`Event ${PLAN_PRICE_CHANGED_EVENT} emitted for plan ${plan.id} via changePlanPrice`);
        } else {
            this.eventEmitter.emit(event.name, event);
        }
    });
    return plan;
  }
}