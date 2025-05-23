import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ICacheService } from './cache.interface';
import { REDIS_CLIENT } from './cache.module';
import { CoreConfigService } from '../config/config.service';

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: CoreConfigService,
  ) {
    this.defaultTTL =
      this.configService.get('DEFAULT_CACHE_TTL_SECONDS') || 300;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redisClient.get(key);
      if (value === null || value === undefined) {
        return undefined;
      }
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        // If it's not a JSON string, return as is (e.g. for counters)
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key} from cache`, error.stack);
      // Depending on strategy, you might want to return undefined or rethrow
      return undefined;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const actualTtl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTTL;
    try {
      const stringValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (actualTtl > 0) {
        await this.redisClient.set(key, stringValue, 'EX', actualTtl);
      } else {
        // If TTL is 0 or negative, set without expiry (or handle as error if desired)
        await this.redisClient.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in cache`, error.stack);
      // Depending on strategy, you might want to rethrow
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from cache`, error.stack);
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redisClient.incrby(key, amount);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} in cache`, error.stack);
      throw error; // Rethrow as increment result is usually expected
    }
  }

  async keyExists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key} in cache`, error.stack);
      return false; // Or rethrow
    }
  }
}