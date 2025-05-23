```typescript
/**
 * @interface IFeatureFlagsService
 * @description Defines the contract for the feature flagging service,
 * ensuring a consistent way to check feature states and retrieve flag configurations.
 */
export interface IFeatureFlagsService {
  /**
   * Checks if a specific feature flag is enabled.
   * @param featureKey - The unique key identifying the feature flag.
   * @param context - Optional context (e.g., user ID, tenant ID) for targeted rollouts.
   * @returns A promise that resolves to `true` if the feature is enabled, `false` otherwise.
   */
  isEnabled(featureKey: string, context?: Record<string, any>): Promise<boolean>;

  /**
   * Gets the configuration value associated with a feature flag.
   * This can be used for flags that hold string, number, or JSON configurations.
   * @template T - The expected type of the feature flag's value.
   * @param featureKey - The unique key identifying the feature flag.
   * @param defaultValue - An optional default value to return if the flag is not found or disabled.
   * @param context - Optional context (e.g., user ID, tenant ID) for targeted rollouts.
   * @returns A promise that resolves to the feature flag's value, or the default value.
   */
  getValue<T = any>(
    featureKey: string,
    defaultValue?: T,
    context?: Record<string, any>,
  ): Promise<T>;
}

/**
 * Token for injecting the FeatureFlagsService.
 */
export const IFeatureFlagsService = Symbol('IFeatureFlagsService');
```