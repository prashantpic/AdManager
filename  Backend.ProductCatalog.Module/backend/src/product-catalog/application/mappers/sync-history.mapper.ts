import { CatalogSyncHistory } from '../../domain/sync-history/catalog-sync-history.entity';
import { CatalogSyncHistoryDto } from '../dtos/catalog-sync-history.dto';
import { SyncStatusDto } from '../dtos/sync-status.dto'; // Assumed to be defined in application/dtos
import { AdPlatform } from '../../domain/common/enums/ad-platform.enum';
import { SyncStatus } from '../../domain/common/enums/sync-status.enum';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Mappers
 * Mapper for CatalogSyncHistory entity and DTOs.
 * Decouples DTO transformation logic for synchronization history data.
 * Transforms CatalogSyncHistory domain entities to various DTOs (e.g., SyncStatusDto for dashboard summary, CatalogSyncHistoryDto for detailed lists).
 */
export class SyncHistoryMapper {
  /**
   * Aggregates history entries to a summary SyncStatusDto for a specific platform.
   * It typically takes the most recent entry for that platform.
   * @param {CatalogSyncHistory[]} historyEntries - A list of history entries, usually for one catalog.
   * @param {AdPlatform} adPlatform - The ad platform to filter and summarize for.
   * @returns {SyncStatusDto | null} The aggregated sync status DTO, or null if no relevant history.
   */
  public static toSyncStatusDto(
    historyEntries: CatalogSyncHistory[],
    adPlatform: AdPlatform,
  ): SyncStatusDto | null {
    const platformEntries = historyEntries
      .filter((entry) => entry.adPlatform === adPlatform)
      .sort((a, b) => b.syncStartedAt.getTime() - a.syncStartedAt.getTime()); // Sort descending by start time

    if (platformEntries.length === 0) {
      return null;
    }

    const latestEntry = platformEntries[0];
    return {
      adPlatform: latestEntry.adPlatform,
      lastSyncStartedAt: latestEntry.syncStartedAt,
      lastSyncEndedAt: latestEntry.syncEndedAt,
      status: latestEntry.status,
      errorMessage: latestEntry.errorMessage,
      // If SyncStatusDto has more fields like successCount, failureCount in a period,
      // then historyEntries would need to be processed more extensively.
      // This implementation provides the status of the LATEST sync attempt.
    };
  }

  /**
   * Maps a CatalogSyncHistory entity to a CatalogSyncHistoryDto.
   * @param {CatalogSyncHistory} entity - The CatalogSyncHistory entity.
   * @returns {CatalogSyncHistoryDto} The mapped CatalogSyncHistoryDto.
   */
  public static toCatalogSyncHistoryDto(
    entity: CatalogSyncHistory,
  ): CatalogSyncHistoryDto {
    const dto: CatalogSyncHistoryDto = {
      id: entity.id,
      adPlatform: entity.adPlatform,
      syncStartedAt: entity.syncStartedAt,
      syncEndedAt: entity.syncEndedAt,
      status: entity.status,
      errorMessage: entity.errorMessage,
      errorCode: entity.errorCode,
      details: typeof entity.details === 'string' ? entity.details : JSON.stringify(entity.details), // Ensure details is string
      retries: entity.retries,
    };
    return dto;
  }

  /**
   * Maps a list of CatalogSyncHistory entities to a list of CatalogSyncHistoryDto objects.
   * @param {CatalogSyncHistory[]} entities - The list of CatalogSyncHistory entities.
   * @returns {CatalogSyncHistoryDto[]} The list of mapped CatalogSyncHistoryDto objects.
   */
  public static toCatalogSyncHistoryDtoList(
    entities: CatalogSyncHistory[],
  ): CatalogSyncHistoryDto[] {
    return entities.map((entity) => this.toCatalogSyncHistoryDto(entity));
  }
}