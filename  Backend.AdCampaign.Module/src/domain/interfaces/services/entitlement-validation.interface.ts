export enum CampaignFeature {
  ADVANCED_TARGETING = 'ADVANCED_TARGETING',
  UNLIMITED_CAMPAIGNS = 'UNLIMITED_CAMPAIGNS',
  SPECIFIC_AD_NETWORK_ACCESS = 'SPECIFIC_AD_NETWORK_ACCESS', // Might need parameter for network type
  // ... other features
}

export enum UsageLimitType {
  ACTIVE_CAMPAIGNS = 'ACTIVE_CAMPAIGNS',
  AD_SETS_PER_CAMPAIGN = 'AD_SETS_PER_CAMPAIGN',
  ADS_PER_AD_SET = 'ADS_PER_AD_SET',
  // ... other usage limits
}

export interface IEntitlementValidationService {
  checkCampaignLimit(
    merchantId: string,
    limitType: UsageLimitType,
    currentCount?: number, // Optional, if the service needs to know the current state
  ): Promise<{ allowed: boolean; limit?: number; current?: number }>;

  checkFeatureEntitlement(
    merchantId: string,
    feature: CampaignFeature | string, // Allow string for dynamic feature names
    params?: Record<string, any>, // e.g., { adNetwork: 'GOOGLE_ADS' }
  ): Promise<boolean>;
}

export const IEntitlementValidationService = Symbol('IEntitlementValidationService');