import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CatalogSyncHistory } from '../../../../domain/sync-history/catalog-sync-history.entity';
import { ICatalogSyncHistoryRepository } from '../../../../domain/sync-history/interfaces/catalog-sync-history.repository.interface';
import { AdManager } from '../../../../domain/common/enums/ad-platform.enum';

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Persistence.TypeOrm {
  /**
   * TypeORM repository for Catalog Sync History.
   * Handles database operations for CatalogSyncHistory entities using TypeORM and PostgreSQL.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class TypeOrmCatalogSyncHistoryRepository
    implements ICatalogSyncHistoryRepository {
    constructor(
      @InjectRepository(CatalogSyncHistory)
      private readonly syncHistoryRepository: Repository<CatalogSyncHistory>,
    ) {}

    async findByCatalogId(
      catalogId: string,
      limit: number = 20,
      offset: number = 0,
    ): Promise<CatalogSyncHistory[]> {
      return this.syncHistoryRepository.find({
        where: { catalog: { id: catalogId } },
        order: { syncStartedAt: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['catalog'], // Optionally load catalog if needed, but usually not for history list
      });
    }

    async findLatestByCatalogAndPlatform(
      catalogId: string,
      adPlatform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform,
    ): Promise<CatalogSyncHistory | null> {
      return this.syncHistoryRepository.findOne({
        where: {
          catalog: { id: catalogId },
          adPlatform,
        } as FindOptionsWhere<CatalogSyncHistory>, // Added type assertion
        order: { syncStartedAt: 'DESC' },
      });
    }

    async save(
      syncHistoryEntry: CatalogSyncHistory,
    ): Promise<CatalogSyncHistory> {
      return this.syncHistoryRepository.save(syncHistoryEntry);
    }
  }
}