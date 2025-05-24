import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MerchantEntitlementDto } from '../dto/merchant-entitlement.dto';
import { ENTITLEMENT_CACHE_KEY_PREFIX } from '../constants/entitlement.constants';
import { EntitlementConfiguration } from '../config/entitlement.config';

@Injectable()
export class EntitlementCacheService {
  private readonly logger = new Logger(EntitlementCacheService.name);
  private readonly cacheKeyPrefix: string;
  private readonly defaultCacheTtl: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const entitlementConfig = this.configService.get<EntitlementConfiguration>('entitlement');
    this.cacheKeyPrefix = ENTITLEMENT_CACHE_KEY_PREFIX;
    this.defaultCacheTtl = entitlementConfig?.ENTITLEMENT_CACHE_TTL_SECONDS ?? 3600;
  }

  private getCacheKey(merchantId: string): string {
    return `${this.cacheKeyPrefix}${merchantId}`;
  }

  async getCachedEntitlements(merchantId: string): Promise<MerchantEntitlementDto | null> {
    const cacheKey = this.getCacheKey(merchantId);
    try {
      const cachedData = await this.cacheManager.get<string | MerchantEntitlementDto>(cacheKey);
      if (cachedData) {
        if (typeof cachedData === 'string') {
          return JSON.parse(cachedData) as MerchantEntitlementDto;
        }
        return cachedData; // Assume it's already an object if not string
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting cached entitlements for merchant ${merchantId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async setCachedEntitlements(
    merchantId: string,
    entitlements: MerchantEntitlementDto,
    ttlInSeconds?: number,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(merchantId);
    const ttl = ttlInSeconds ?? this.defaultCacheTtl;
    try {
      const dataToStore = JSON.stringify(entitlements);
      await this.cacheManager.set(cacheKey, dataToStore, ttl * 1000); // cache-manager uses milliseconds for TTL
    } catch (error) {
      this.logger.error(`Error setting cached entitlements for merchant ${merchantId}: ${error.message}`, error.stack);
    }
  }

  async clearCachedEntitlements(merchantId: string): Promise<void> {
    const cacheKey = this.getCacheKey(merchantId);
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.log(`Cleared cached entitlements for merchant ${merchantId}`);
    } catch (error) {
      this.logger.error(`Error clearing cached entitlements for merchant ${merchantId}: ${error.message}`, error.stack);
    }
  }
}