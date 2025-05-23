import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
import { AdManager } from '../../../../domain/common/enums/ad-platform.enum';
import { ProductCatalogConstants } from '../../../application/constants/product-catalog.constants';

// Placeholder for Ad Platform specific clients from Backend.Integration.Module
// Example:
// import { GoogleAdsClient, FacebookAdsClient } from '@admanager/backend-integration';

interface AdPlatformClient {
  submitFeed(feedUrl: string, credentials: any, catalogName: string): Promise<{ success: boolean; responseData?: any; errorDetails?: { message: string; code?: string; isTransient?: boolean } }>;
}

// Factory to get the correct client (conceptual)
interface AdPlatformClientFactory {
  getClient(platform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform): AdPlatformClient;
}


export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Adapters {
  /**
   * Adapter for ad platform integration services for product catalogs.
   * Handles the actual synchronization of product catalog feeds with specific ad platforms.
   * Implements retry logic for transient failures.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class ProductCatalogAdPlatformIntegrationAdapter {
    private readonly logger = new Logger(ProductCatalogAdPlatformIntegrationAdapter.name);
    private readonly maxRetries: number;
    private readonly initialRetryDelayMs: number;

    constructor(
      private readonly configService: ConfigService,
      // @Inject('AdPlatformClientFactory') // Injected from IntegrationModule
      private readonly adPlatformClientFactory: AdPlatformClientFactory, // Placeholder
    ) {
      this.maxRetries = this.configService.get<number>(ProductCatalogConstants.CONFIG_KEY_MAX_SYNC_RETRIES, 3);
      this.initialRetryDelayMs = this.configService.get<number>(ProductCatalogConstants.CONFIG_KEY_INITIAL_RETRY_DELAY_MS, 1000);
    }

    /**
     * Synchronizes the catalog feed with the specified ad platform.
     * @param catalog The catalog entity.
     * @param feedUrl The URL of the generated feed.
     * @param adPlatform The target ad platform.
     * @param merchantPlatformCredentials Credentials or tokens for the ad platform API.
     * @returns Promise with sync status and platform-specific response or error.
     */
    async syncCatalogToPlatform(
      catalog: Catalog,
      feedUrl: string,
      adPlatform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform,
      merchantPlatformCredentials: any, // Type should be more specific per platform eventually
    ): Promise<{
      success: boolean;
      platformSpecificResponse?: any;
      error?: { message: string; code?: string; isTransient?: boolean };
      retriesAttempted?: number;
    }> {
      this.logger.log(`Attempting to sync catalog ID ${catalog.id} to ${adPlatform} using feed URL: ${feedUrl}`);

      const client = this.adPlatformClientFactory.getClient(adPlatform);
      if (!client) {
        const errorMsg = `No integration client found for ad platform: ${adPlatform}`;
        this.logger.error(errorMsg);
        return { success: false, error: { message: errorMsg, isTransient: false } };
      }

      let attempts = 0;
      let currentDelay = this.initialRetryDelayMs;

      while (attempts <= this.maxRetries) {
        try {
          this.logger.log(`Sync attempt ${attempts + 1} for catalog ID ${catalog.id} to ${adPlatform}.`);
          const result = await client.submitFeed(feedUrl, merchantPlatformCredentials, catalog.name);

          if (result.success) {
            this.logger.log(`Successfully synced catalog ID ${catalog.id} to ${adPlatform}.`);
            return { success: true, platformSpecificResponse: result.responseData, retriesAttempted: attempts };
          } else {
            this.logger.warn(`Sync attempt ${attempts + 1} failed for catalog ID ${catalog.id} to ${adPlatform}. Error: ${result.errorDetails?.message}`);
            if (result.errorDetails?.isTransient && attempts < this.maxRetries) {
              // Transient error, prepare for retry
              this.logger.log(`Transient error detected. Retrying in ${currentDelay}ms...`);
            } else {
              // Non-transient error or max retries reached
              return { success: false, error: result.errorDetails, retriesAttempted: attempts };
            }
          }
        } catch (error) {
          // Catch errors from the client.submitFeed call itself (e.g., network issues)
          const errorMessage = error.message || 'Unknown error during platform API call.';
          this.logger.error(`Exception during sync attempt ${attempts + 1} for catalog ID ${catalog.id} to ${adPlatform}. Error: ${errorMessage}`, error.stack);
          
          // Assume exceptions are potentially transient unless specified otherwise by the client
          const isErrorTransient = (error as any).isTransient !== undefined ? (error as any).isTransient : true;

          if (isErrorTransient && attempts < this.maxRetries) {
             this.logger.log(`Exception considered transient. Retrying in ${currentDelay}ms...`);
          } else {
            return { success: false, error: { message: errorMessage, code: (error as any).code, isTransient: isErrorTransient }, retriesAttempted: attempts };
          }
        }

        // If we are retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2; // Exponential backoff (jitter could be added)
        attempts++;
      }
      
      // Should not be reached if logic is correct, but as a fallback:
      return { 
        success: false, 
        error: { message: 'Max retries reached without success.', isTransient: false },
        retriesAttempted: attempts -1 // attempts already incremented
      };
    }
  }
}