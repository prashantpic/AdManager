import { registerAs } from '@nestjs/config';
import { ProductCatalogConstants } from '../product-catalog.constants';

/**
 * @Namespace AdManager.Platform.Backend.ProductCatalog.Config
 * @Purpose Provides type-safe access to environment variables and default settings for the Product Catalog module.
 * @GeneratedBy ADM-Tools
 */
export const productCatalogConfig = registerAs('productCatalog', () => ({
  defaultSyncCron:
    process.env.PRODUCT_CATALOG_DEFAULT_SYNC_CRON ||
    ProductCatalogConstants.DEFAULT_SCHEDULED_SYNC_CRON,
  maxSyncRetries: parseInt(
    process.env.PRODUCT_CATALOG_MAX_SYNC_RETRIES || '3',
    10,
  ),
  initialRetryDelayMs: parseInt(
    process.env.PRODUCT_CATALOG_INITIAL_RETRY_DELAY_MS || '1000',
    10,
  ),
  sqsQueueCatalogSyncTrigger:
    process.env.PRODUCT_CATALOG_SQS_QUEUE_CATALOG_SYNC_TRIGGER ||
    ProductCatalogConstants.SQS_QUEUE_CATALOG_SYNC_TRIGGER,
  featureFlags: {
    enableRealtimeWebhookProcessingForProductUpdates:
      process.env.PRODUCT_CATALOG_FF_REALTIME_WEBHOOK_PROCESSING === 'true',
    enableAutomatedProductQuarantiningOnSyncFailure:
      process.env.PRODUCT_CATALOG_FF_AUTO_QUARANTINE === 'true',
  },
}));