import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '../constants/feature.constants';

export const ENTITLEMENT_METADATA_KEY = 'hasEntitlementMetadata';

export interface EntitlementMetadata {
  featureKey: FeatureKey;
  quantityToAdd?: number; // Default is 1 if not specified, handled by service/guard
}

/**
 * Decorator to specify that a route or method requires a specific feature entitlement.
 * @param featureKey The unique key of the feature to check.
 * @param quantityToAdd The quantity of the resource being requested/actioned upon (e.g., creating 1 campaign). Defaults to 1.
 */
export const HasEntitlement = (
  featureKey: FeatureKey,
  quantityToAdd?: number,
) => SetMetadata<string, EntitlementMetadata>(ENTITLEMENT_METADATA_KEY, { featureKey, quantityToAdd });