import { CatalogSyncHistory } from '../catalog-sync-history.entity';
import { AdPlatform } from '../../../common/enums/ad-platform.enum'; // Adjusted import path

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.SyncHistory.Interfaces
 * Catalog sync history repository interface.
 * Abstracts data persistence operations for CatalogSyncHistory entities.
 * Defines the contract for accessing and storing catalog synchronization history records.
 */
export interface ICatalogSyncHistoryRepository {
  /**
   * Finds synchronization history entries for a specific catalog.
   * @param {string} catalogId - The ID of the catalog.
   * @param {number} [limit] - Optional limit for pagination.
   * @param {number} [offset] - Optional offset for pagination.
   * @returns {Promise<CatalogSyncHistory[]>} A list of sync history entries.
   */
  findByCatalogId(
    catalogId: string,
    limit?: number,
    offset?: number,
  ): Promise<CatalogSyncHistory[]>;

  /**
   * Finds the latest synchronization history entry for a specific catalog and ad platform.
   * @param {string} catalogId - The ID of the catalog.
   * @param {AdPlatform} adPlatform - The ad platform.
   * @returns {Promise<CatalogSyncHistory | null>} The latest sync history entry if found, otherwise null.
   */
  findLatestByCatalogAndPlatform(
    catalogId: string,
    adPlatform: AdPlatform,
  ): Promise<CatalogSyncHistory | null>;

  /**
   * Saves a catalog synchronization history entry.
   * @param {CatalogSyncHistory} historyEntry - The history entry to save.
   * @returns {Promise<CatalogSyncHistory>} The saved history entry.
   */
  save(historyEntry: CatalogSyncHistory): Promise<CatalogSyncHistory>;
}

export const ICatalogSyncHistoryRepository = Symbol(
  'ICatalogSyncHistoryRepository',
);