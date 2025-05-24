import { Injectable, Inject } from '@nestjs/common';
import { MerchantSubscriptionAggregate } from '../aggregates/merchant-subscription.aggregate';
import { SubscriptionPlanAggregate } from '../aggregates/subscription-plan.aggregate';
import { SUBSCRIPTION_CONFIG_TOKEN } from '../../constants';
import { SubscriptionModuleConfig, ProrationPolicy } from '../../config/subscription-module.config';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';
import { PricingVO } from '../value-objects/pricing.vo';

@Injectable()
export class ProrationCalculatorDomainService {
  private readonly config: SubscriptionModuleConfig;

  constructor(
    @Inject(SUBSCRIPTION_CONFIG_TOKEN) config: SubscriptionModuleConfig,
  ) {
    // A default config could be set here if injection fails or is optional
    this.config = config || { 
        dunningRetryAttempts: 3, 
        prorationPolicy: ProrationPolicy.PRORATED,
        dunningRetryIntervalHours: 24,
        suspensionAfterDaysPastDue: 7,
        terminationAfterDaysSuspended: 30,
    };
  }

  private getPlanPriceForCycle(plan: SubscriptionPlanAggregate, cycle: BillingCycle): number | null {
    const pricingTier = plan.pricingTiers.find(pt => pt.cycle === cycle);
    return pricingTier ? pricingTier.amount : null;
  }

  public calculateProration(
    currentSubscription: MerchantSubscriptionAggregate,
    newPlan: SubscriptionPlanAggregate,
    changeDate: Date,
    currentPlanDetails: SubscriptionPlanAggregate, // Need details of the current plan
  ): number {
    const policy = this.config.prorationPolicy;

    const { currentPeriodStart, currentPeriodEnd, billingCycle } = currentSubscription;

    // If change date is outside the current period or at the very end, no proration for this cycle.
    if (changeDate >= currentPeriodEnd || changeDate < currentPeriodStart) {
      return 0;
    }

    const oldPlanPrice = this.getPlanPriceForCycle(currentPlanDetails, billingCycle);
    const newPlanPrice = this.getPlanPriceForCycle(newPlan, billingCycle);

    if (oldPlanPrice === null || newPlanPrice === null) {
      // This implies a misconfiguration or plan not supporting the cycle.
      // Depending on business rules, could throw error or default to no proration.
      console.warn("Proration calculation error: Plan price not found for billing cycle.");
      return 0; 
    }

    // If prices are the same, no proration needed unless other factors change.
    if (oldPlanPrice === newPlanPrice) {
      return 0;
    }

    const totalCycleDurationMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
    if (totalCycleDurationMs <= 0) return 0; // Avoid division by zero

    const remainingCycleMs = currentPeriodEnd.getTime() - changeDate.getTime();
    const proportionOfCycleRemaining = remainingCycleMs / totalCycleDurationMs;

    let prorationAmount = 0;

    switch (policy) {
      case ProrationPolicy.PRORATED:
        const creditForOldPlan = oldPlanPrice * proportionOfCycleRemaining;
        const chargeForNewPlan = newPlanPrice * proportionOfCycleRemaining;
        prorationAmount = chargeForNewPlan - creditForOldPlan;
        break;
      case ProrationPolicy.NO_CREDIT:
        // If upgrading, charge the difference for the remaining period.
        // If downgrading, no credit, charge is 0 unless it's an immediate full charge for new plan.
        // Assuming NO_CREDIT means no refund for unused old plan time.
        // Charge for new plan's remaining time.
        if (newPlanPrice > oldPlanPrice) { // Upgrade
            prorationAmount = (newPlanPrice - oldPlanPrice) * proportionOfCycleRemaining; // Charge difference
        } else { // Downgrade or same price (already handled)
            prorationAmount = 0; // No credit for downgrade. Charge for new plan implicitly handled next cycle.
        }
        break;
      case ProrationPolicy.FULL_CREDIT: // This might be same as PRORATED if it means full credit for unused and full charge for new.
                                       // Or it could mean immediate refund of old plan remaining, and charge full new plan from changeDate.
                                       // Assuming it's like PRORATED for now.
        const creditFull = oldPlanPrice * proportionOfCycleRemaining;
        const chargeFull = newPlanPrice * proportionOfCycleRemaining;
        prorationAmount = chargeFull - creditFull;
        break;
      default: // Default to no proration or throw error for unknown policy
        console.warn(`Unknown proration policy: ${policy}. Defaulting to no proration.`);
        return 0;
    }
    
    // Round to 2 decimal places (cents)
    return Math.round(prorationAmount * 100) / 100;
  }
}