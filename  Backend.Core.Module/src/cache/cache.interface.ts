```typescript
/**
 * @interface ICacheService
 * @description Defines standard operations for a cache service.
 */
export interface ICacheService {
  /**
   * Retrieves a value from the cache by key.
   * @template T - The expected type of the cached value.
   * @param key - The key of the item to retrieve.
   * @returns A promise that resolves to the cached value, or undefined if not found or expired.
   *          Handles JSON parsing for non-primitive types.
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Stores a value in the cache with an optional Time-To-Live (TTL).
   * @template T - The type of the value to store.
   * @param key - The key under which to store the value.
   * @param value - The value to store. Handles JSON stringification for non-primitive types.
   * @param ttlSeconds - Optional TTL in seconds. If not provided, a default TTL may be used.
   * @returns A promise that resolves when the operation is complete.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Deletes a key (and its value) from the cache.
   * @param key - The key to delete.
   * @returns A promise that resolves when the operation is complete.
   */
  del(key: string): Promise<void>;

  /**
   * Increments a numeric value stored at a key.
   * If the key does not exist, it is set to 0 before performing the operation.
   * @param key - The key of the numeric value to increment.
   * @param amount - The amount to increment by (defaults to 1).
   * @returns A promise that resolves to the new value after incrementing.
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Checks if a key exists in the cache.
   * @param key - The key to check.
   * @returns A promise that resolves to true if the key exists, false otherwise.
   */
  keyExists(key: string): Promise<boolean>;

  /**
   * Deletes all keys matching a given pattern.
   * Use with caution, especially in production Redis environments (SCAN followed by DEL).
   * @param pattern - The pattern to match keys against (e.g., "user:*").
   * @returns A promise that resolves when the operation is complete.
   */
  deleteByPattern(pattern: string): Promise<void>;

  /**
   * Retrieves the underlying Redis client instance.
   * Useful for performing operations not exposed by ICacheService.
   * Use with caution as it bypasses the abstraction.
   * @returns The Redis client instance.
   */
  getClient<TClient = any>(): TClient;
}

export const ICacheService = Symbol('ICacheService');
```