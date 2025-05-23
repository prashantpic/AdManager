```typescript
/**
 * @interface IFeatureFlagsService
 * @description Defines the contract for the feature flagging service,
 * ensuring a consistent way to check feature states.
 */
export interface IFeatureFlagsService {
  /**
   * Checks if a specific feature is enabled.
   * @param featureKey - The unique key identifying the feature flag.
   * @param context - Optional context (e.g., user ID, tenant ID) for targeted rollouts.
   * @returns A promise that resolves to true if the feature is enabled, false otherwise.
   */
  isEnabled(featureKey: string, context?: Record<string, any>): Promise<boolean>;

  /**
   * Gets the configuration value associated with a feature flag.
   * This can be used for flags that are not simple booleans, e.g., string, number, or JSON.
   * @param featureKey - The unique key identifying the feature flag.
   * @param defaultValue - An optional default value to return if the flag is not found or not configured.
   * @param context - Optional context (e.g., user ID, tenant ID) for targeted rollouts.
   * @returns A promise that resolves to the flag's value, or the default value if provided.
   */
  getValue<T = any>(
    featureKey: string,
    defaultValue?: T,
    context?: Record<string, any>,
  ): Promise<T>;
}

export const IFeatureFlagsService = Symbol('IFeatureFlagsService');
```