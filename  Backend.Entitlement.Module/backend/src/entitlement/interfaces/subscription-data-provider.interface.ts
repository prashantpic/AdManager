import { FeatureKey } from '../constants/feature.constants';

export interface ISubscriptionPlanFeature {
  featureKey: FeatureKey; // Changed from string to FeatureKey for type safety
  isEnabled: boolean;
  limit?: number;
}

export interface ISubscriptionDetails {
  planId: string;
  status: string; // e.g., 'active', 'cancelled', 'past_due', 'trialing'
  subscriptionStartDate: Date;
  subscriptionEndDate: Date | null; // End date for fixed terms or cancellation date
  features: ISubscriptionPlanFeature[]; // Features and limits included in the plan
  // other relevant subscription data like trial status, next billing date, etc.
  trialEndDate?: Date | null;
}

export interface ISubscriptionDataProvider {
  getMerchantSubscription(
    merchantId: string,
  ): Promise<ISubscriptionDetails | null>;
}

// Token for Dependency Injection
export const SUBSCRIPTION_DATA_PROVIDER = Symbol('SUBSCRIPTION_DATA_PROVIDER');