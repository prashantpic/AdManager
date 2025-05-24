import { FeatureKey } from '../constants/feature.constants';

/**
 * Represents the basic structure of a feature entitlement as defined by a subscription plan.
 * This is typically an internal representation derived directly from plan features.
 */
export interface IFeatureEntitlement {
  featureKey: FeatureKey;
  isEnabled: boolean; // Basic access status from the plan
  limit?: number;     // Applicable limit if any, from the plan
}

// IFeatureEntitlementDetails (more comprehensive, including usage, grace period etc.)
// is defined in merchant-entitlement.dto.ts as it's part of the DTO structure
// exposed by the service and used for richer entitlement information.