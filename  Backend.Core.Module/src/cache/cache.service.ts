import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './cache.module';
import { ICacheService } from './cache.interface'; // Assuming this interface exists
import { CoreConfigService } from '../config/config.service';

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: CoreConfigService,
  ) {
    this.defaultTTL = this.configService.get('DEFAULT_CACHE_TTL_SECONDS') || 3600;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redisClient.get(key);
      if (value === null || value === undefined) {
        return undefined;
      }
      // Attempt to parse if it looks like JSON, otherwise return as string
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        return value as unknown as T; // For simple string values
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key} from cache:`, error);
      // Depending on strategy, you might want to return undefined or re-throw
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTTL;
    try {
      const valueToStore =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl > 0) {
        await this.redisClient.set(key, valueToStore, 'EX', ttl);
      } else {
        // Set without TTL if ttl is 0 or negative (or handle as error)
        await this.redisClient.set(key, valueToStore);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in cache:`, error);
      // Depending on strategy, you might want to re-throw
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from cache:`, error);
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redisClient.incrby(key, amount);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} in cache:`, error);
      throw error; // Increment operations might need stricter error handling
    }
  }

  async keyExists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key} in cache:`, error);
      return false; // Or re-throw depending on desired behavior
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }
}