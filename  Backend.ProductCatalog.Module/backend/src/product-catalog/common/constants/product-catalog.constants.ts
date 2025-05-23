// Namespace: AdManager.Platform.Backend.ProductCatalog.Common.Constants

/**
 * Constants for the product catalog module.
 */
export const ProductCatalogConstants = {
  /**
   * SQS queue name for triggering catalog synchronizations.
   */
  SQS_QUEUE_CATALOG_SYNC_TRIGGER: 'catalog-sync-trigger-queue',

  /**
   * Default cron expression for scheduled catalog synchronizations.
   * Default: Every 4 hours at the start of the hour.
   */
  DEFAULT_SCHEDULED_SYNC_CRON: '0 */4 * * *',

  /**
   * Configuration key for the maximum number of sync retries.
   */
  CONFIG_KEY_MAX_RETRIES: 'productCatalog.maxSyncRetries',

  /**
   * Configuration key for the initial delay (in milliseconds) before the first retry attempt.
   */
  CONFIG_KEY_INITIAL_RETRY_DELAY_MS: 'productCatalog.initialRetryDelayMs',
} as const;