import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';

export class AppPricing {
  public readonly model: AppPricingModel;
  public readonly amount: number; // Stored as smallest currency unit (e.g., cents)
  public readonly currency: string; // ISO 4217 currency code
  public readonly billingCycle?: 'monthly' | 'annual' | null; // Applicable for subscriptions
  public readonly trialDays?: number | null; // Number of free trial days

  constructor(
    model: AppPricingModel,
    amount: number,
    currency: string,
    billingCycle?: 'monthly' | 'annual' | null,
    trialDays?: number | null,
  ) {
    if (model !== AppPricingModel.FREE && (amount < 0 || !currency)) {
      throw new Error('Amount and currency are required for non-free pricing models.');
    }
    if (model === AppPricingModel.FREE) {
        amount = 0; // Ensure amount is 0 for free apps
    }
    if ((model === AppPricingModel.SUBSCRIPTION_MONTHLY || model === AppPricingModel.SUBSCRIPTION_ANNUAL) && !billingCycle) {
        throw new Error('Billing cycle is required for subscription models.');
    }
    if (trialDays && trialDays < 0) {
        throw new Error('Trial days cannot be negative.');
    }


    this.model = model;
    this.amount = amount;
    this.currency = currency;
    this.billingCycle = billingCycle;
    this.trialDays = trialDays;

    Object.freeze(this); // Ensure immutability
  }
}