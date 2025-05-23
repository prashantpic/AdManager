import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductCatalogService } from '../../../application/services/product-catalog.service';
import { ICatalogRepository } from '../../../../domain/catalog/interfaces/catalog.repository.interface';
import { ConfigService } from '@nestjs/config';
import { ProductCatalogConstants } from '../../../application/constants/product-catalog.constants';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
// For parsing cron expressions if needed within the service to check against individual catalog schedules
// import cronParser from 'cron-parser';

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Jobs {
  /**
   * Scheduler for automated catalog synchronization.
   * Periodically triggers the synchronization process for catalogs.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class CatalogSyncScheduler {
    private readonly logger = new Logger(CatalogSyncScheduler.name);

    constructor(
      private readonly productCatalogService: ProductCatalogService,
      private readonly catalogRepository: ICatalogRepository, // Injected via module provider
      private readonly configService: ConfigService,
    ) {}

    /**
     * Handles scheduled catalog synchronizations.
     * This cron job runs at a configured interval (e.g., every 4 hours).
     * It fetches catalogs that are configured for scheduled syncs.
     * The `ProductCatalogService.initiateSyncForPlatform` will then handle
     * the actual feed generation and platform submission.
     * The decision whether a specific catalog should sync *now* can be:
     * 1. Based on its individual cron schedule stored on the Catalog entity.
     * 2. Or, if all scheduled catalogs sync whenever this global cron runs.
     * The SDS implies this scheduler calls `catalogRepository.findDueForScheduledSync`.
     */
    @Cron(
      process.env.PRODUCT_CATALOG_DEFAULT_SYNC_CRON || // Env variable override
      ProductCatalogConstants.DEFAULT_SCHEDULED_SYNC_CRON, // Default from constants
      { name: 'scheduledCatalogSync' }
    )
    async handleCronSyncCatalogs(): Promise<void> {
      this.logger.log('Scheduled catalog sync process started.');

      try {
        // Fetch catalogs that are configured for scheduled sync and are "due"
        // The definition of "due" depends on the implementation of findDueForScheduledSync
        const catalogsToSync = await this.catalogRepository.findDueForScheduledSync(new Date());
        // As per TypeOrmCatalogRepository's findDueForScheduledSync, it returns catalogs with `syncEnabled: true` and a `syncScheduleCron`.
        // The service will need to check if the catalog's specific cron matches the current time.

        if (!catalogsToSync || catalogsToSync.length === 0) {
          this.logger.log('No catalogs are currently due for scheduled synchronization.');
          return;
        }

        this.logger.log(`Found ${catalogsToSync.length} catalog(s) to potentially sync.`);

        for (const catalog of catalogsToSync) {
          // The `initiateSyncForPlatform` should ideally check if this specific catalog's
          // schedule (if it has an individual one) matches the current time,
          // or if finding it via `findDueForScheduledSync` is sufficient.
          // For now, we assume `findDueForScheduledSync` is smart enough or the service handles it.
          // If catalog has its own cron (e.g., catalog.syncScheduleCron), check it here:
          // try {
          //   const interval = cronParser.parseExpression(catalog.syncScheduleCron, { currentDate: new Date() });
          //   // Check if previous run time was within the last execution window of this global scheduler
          //   // This logic can get complex. A simpler model is `nextScheduledSyncAt <= NOW()`.
          // } catch (e) { this.logger.error(`Invalid cron for catalog ${catalog.id}`); continue; }

          this.logger.log(`Initiating sync for catalog: ${catalog.name} (ID: ${catalog.id}) for platform: ${catalog.adPlatform}`);
          try {
            // The service needs merchantId, which is on the catalog entity.
            await this.productCatalogService.initiateSyncForPlatform(
              catalog.id,
              catalog.adPlatform, // Catalog is usually tied to one ad platform
              catalog.merchantId,
              true // Indicate this is a scheduled sync
            );
            this.logger.log(`Successfully initiated sync for catalog ID: ${catalog.id}`);
          } catch (error) {
            this.logger.error(
              `Failed to initiate sync for catalog ID: ${catalog.id}. Error: ${error.message}`,
              error.stack,
            );
            // Further error handling/notification could be done here or by the service
          }
        }
      } catch (error) {
        this.logger.error(
          `Error during scheduled catalog sync process: ${error.message}`,
          error.stack,
        );
      } finally {
        this.logger.log('Scheduled catalog sync process finished.');
      }
    }
  }
}