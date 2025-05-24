import { FeatureKey } from '../constants/feature.constants';

export interface IMerchantUsageProvider {
  /**
   * An array of FeatureKey enums that this provider can report usage for.
   * This helps the EntitlementService to select the correct provider.
   */
  supportedFeatureKeys: FeatureKey[];

  /**
   * Retrieves the current usage count for a specific feature for a given merchant.
   * @param merchantId The ID of the merchant.
   * @param featureKey The specific feature for which to get usage.
   * @returns A promise that resolves to the current usage number (e.g., number of active campaigns).
   */
  getCurrentUsage(merchantId: string, featureKey: FeatureKey): Promise<number>;

  /**
   * Optional: A method that could be called to enforce limits,
   * e.g., disable excess items after a grace period expires.
   * This is an advanced feature and might be handled by publishing an event instead.
   *
   * @param merchantId The ID of the merchant.
   * @param featureKey The feature for which the limit needs enforcement.
   * @param newLimit The new limit to enforce.
   * @returns A promise that resolves when enforcement action is completed or queued.
   */
  // enforceLimit?(merchantId: string, featureKey: FeatureKey, newLimit: number): Promise<void>;
}

// Token for DI (optional, if injecting a collection of providers)
// export const MERCHANT_USAGE_PROVIDERS = Symbol('MERCHANT_USAGE_PROVIDERS');
// Alternatively, individual providers can be injected using their class names or custom tokens.