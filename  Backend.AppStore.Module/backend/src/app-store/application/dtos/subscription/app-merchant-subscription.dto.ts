import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';

export enum AppSubscriptionStatus {
    ACTIVE = 'active',
    TRIALING = 'trialing',
    CANCELLED = 'cancelled',
    PAST_DUE = 'past_due',
    INCOMPLETE = 'incomplete',
}


export class AppMerchantSubscriptionDto {
  id: string;
  installationId: string;
  appId: string;
  appName?: string; // Denormalized
  merchantId: string;
  status: AppSubscriptionStatus;
  pricingModel: AppPricingModel; // From the AppEntity at time of subscription
  amount: number; // Price per billing cycle
  currency: string;
  billingCycle: 'monthly' | 'annual' | 'one-time'; // Or AppBillingCycle enum
  startDate: Date;
  endDate?: Date; // For fixed-term or cancelled subscriptions
  trialEndDate?: Date;
  renewalDate?: Date; // Next billing date
  externalSubscriptionId?: string; // ID from payment gateway / billing system
  createdAt: Date;
  updatedAt: Date;
}