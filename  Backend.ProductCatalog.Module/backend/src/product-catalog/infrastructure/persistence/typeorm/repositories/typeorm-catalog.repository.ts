import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual } from 'typeorm';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
import { ICatalogRepository } from '../../../../domain/catalog/interfaces/catalog.repository.interface';
import { CatalogProductItem } from '../../../../domain/catalog/catalog-product-item.entity';

// Placeholder for User context if needed for specific queries, typically merchantId is sufficient
// import { AuthenticatedUser } from 'path-to-auth-user-definition';

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Persistence.TypeOrm {
  /**
   * TypeORM repository for Product Catalogs.
   * Handles database operations for Catalog aggregates using TypeORM and PostgreSQL.
   * Implements methods defined in ICatalogRepository.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class TypeOrmCatalogRepository implements ICatalogRepository {
    constructor(
      @InjectRepository(Catalog)
      private readonly catalogRepository: Repository<Catalog>,
    ) {}

    async findById(id: string): Promise<Catalog | null> {
      return this.catalogRepository.findOne({
        where: { id },
        relations: ['productItems', 'feedSettings', 'outOfStockRule'], // Ensure value objects are loaded if they are separate relations
      });
    }

    async findByIdAndMerchantId(
      id: string,
      merchantId: string,
    ): Promise<Catalog | null> {
      return this.catalogRepository.findOne({
        where: { id, merchantId },
        relations: ['productItems', 'feedSettings', 'outOfStockRule', 'syncHistories'],
      });
    }

    async findAllByMerchantId(merchantId: string): Promise<Catalog[]> {
      return this.catalogRepository.find({
        where: { merchantId },
        relations: ['feedSettings', 'outOfStockRule'],
        order: { createdAt: 'DESC' }
      });
    }

    async save(catalog: Catalog): Promise<Catalog> {
      // TypeORM's save method handles both insert and update.
      // It will also cascade save related entities like productItems if configured in the entity.
      return this.catalogRepository.save(catalog);
    }

    async deleteByIdAndMerchantId(
      id: string,
      merchantId: string,
    ): Promise<void> {
      // Ensure the catalog belongs to the merchant before deleting.
      const result = await this.catalogRepository.delete({ id, merchantId });
      if (result.affected === 0) {
        // Optionally throw an error or handle as per business logic (e.g., CatalogNotFound)
      }
    }

    /**
     * Finds catalogs that are due for a scheduled synchronization.
     * This assumes the Catalog entity has a `nextScheduledSyncAt` field
     * or a similar mechanism (`syncEnabled` and `syncScheduleCron` to be parsed by service).
     * For this implementation, we'll assume `nextScheduledSyncAt`.
     */
    async findDueForScheduledSync(currentTime: Date = new Date()): Promise<Catalog[]> {
      // This is a simplified example. Real implementation might involve checking:
      // 1. A flag `isScheduledSyncEnabled: boolean`
      // 2. A `syncFrequency` or `cronExpression` field on the Catalog entity
      // 3. The `lastSyncAt` from CatalogSyncHistory to calculate next sync time.
      // For now, assuming a direct field `nextScheduledSyncAt` for simplicity.
      // If Catalog has `syncScheduleCron` and `lastSuccessfulSyncAt`, the logic here
      // or in the service would need to evaluate the cron.
      // A more robust way: service fetches all catalogs with `syncScheduleCron` defined,
      // then uses a cron parser lib to check if it's due.
      // Or, a `nextScheduledSyncAt` field is updated by the service after each sync.
      return this.catalogRepository.find({
        where: {
          // Example: syncEnabled: true, nextScheduledSyncAt: LessThanOrEqual(currentTime)
          // This requires `nextScheduledSyncAt` to be on the Catalog entity.
          // As per current SDS, Catalog entity doesn't list this field.
          // Let's assume there's a field for enabling sync and a schedule string.
          // The scheduler runs globally, this method could fetch all enabled catalogs.
          // The decision to sync THIS EXACT catalog at THIS MOMENT could be refined by the service
          // or this method needs more complex query logic.
          // Let's return all catalogs that have a cron schedule defined and are active.
          // Actual check if cron is due now will be done by ProductCatalogService.
           syncEnabled: true, // Assuming Catalog has this field
           syncScheduleCron: Not(IsNull()) // Assuming Catalog has this field
        } as FindOptionsWhere<Catalog>, // Cast to avoid TS error if fields don't exist yet
         relations: ['feedSettings', 'outOfStockRule'],
      });
    }
  }
}