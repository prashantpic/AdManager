```typescript
/**
 * @interface ICacheService
 * @description Defines the contract for caching services, specifying standard operations.
 */
export interface ICacheService {
  /**
   * Retrieves a value from the cache by key.
   * @template T The expected type of the cached value.
   * @param key The key of the item to retrieve.
   * @returns A promise that resolves to the cached value, or undefined if not found or expired.
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Stores a value in the cache.
   * @template T The type of the value to store.
   * @param key The key under which to store the value.
   * @param value The value to store.
   * @param ttlSeconds Optional. Time-to-live in seconds. If not provided, a default TTL may be used.
   * @returns A promise that resolves when the value is set.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Deletes a value from the cache by key.
   * @param key The key of the item to delete.
   * @returns A promise that resolves when the item is deleted.
   */
  del(key: string): Promise<void>; // Changed from delete to del to avoid keyword clash

  /**
   * Increments a numeric value stored in the cache.
   * If the key does not exist, it is set to 0 before performing the operation.
   * @param key The key of the numeric item to increment.
   * @param amount The amount to increment by (default is 1).
   * @returns A promise that resolves to the value of key after the increment.
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Checks if a key exists in the cache.
   * @param key The key to check.
   * @returns A promise that resolves to true if the key exists, false otherwise.
   */
  keyExists(key: string): Promise<boolean>;

  // Potentially add more advanced operations like:
  // mget<T>(keys: string[]): Promise<(T | undefined)[]>;
  // mset<T>(items: { key: string; value: T; ttlSeconds?: number }[]): Promise<void>;
  // hget<T>(hashKey: string, field: string): Promise<T | undefined>;
  // hset<T>(hashKey: string, field: string, value: T): Promise<void>;
}

/**
 * Token for injecting the CacheService.
 */
export const ICacheService = Symbol('ICacheService');
```