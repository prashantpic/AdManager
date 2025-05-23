import { Catalog } from '../../domain/catalog/catalog.aggregate';
import { CatalogSyncHistory } from '../../domain/sync-history/catalog-sync-history.entity';
import { CatalogDto } from '../dtos/catalog.dto'; // Assumed to be defined in application/dtos

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Mappers
 * Mapper for Catalog entity and CatalogDto.
 * Decouples DTO transformation logic from services and controllers for Catalog entities.
 * Contains static methods for transforming Catalog domain entities to CatalogDto objects,
 * potentially enriching with related data like last sync status or product count.
 */
export class CatalogMapper {
  /**
   * Maps a Catalog entity to a CatalogDto.
   * @param {Catalog} entity - The Catalog entity.
   * @param {CatalogSyncHistory} [lastSync] - Optional last sync history for this catalog.
   * @returns {CatalogDto} The mapped CatalogDto.
   */
  public static toDto(
    entity: Catalog,
    lastSync?: CatalogSyncHistory, // Note: This parameter might be better handled by aggregating sync status per platform
  ): CatalogDto {
    const dto: CatalogDto = {
      id: entity.id,
      merchantId: entity.merchantId,
      name: entity.name,
      description: entity.description,
      adPlatform: entity.adPlatform,
      feedSettings: entity.feedSettings, // Value object, directly assignable if DTO matches
      outOfStockRule: entity.outOfStockRule, // Value object, directly assignable if DTO matches
      productItemCount: entity.productItems?.length || 0,
      // lastSyncStatus: lastSync ? { // This needs to be more structured if showing last sync for a *specific* platform
      //   status: lastSync.status,
      //   lastSyncAt: lastSync.syncEndedAt || lastSync.syncStartedAt,
      // } : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    // To properly represent lastSyncStatus, CatalogDto would need a structure for it,
    // potentially an array of last sync statuses per platform or the overall latest.
    // The provided `lastSync` parameter is singular, so it's simplified here.
    // For a dashboard, `getSyncStatusDashboard` would provide more comprehensive SyncStatusDto[].
    return dto;
  }

  /**
   * Maps a list of Catalog entities to a list of CatalogDto objects.
   * @param {Catalog[]} entities - The list of Catalog entities.
   * @param {Map<string, CatalogSyncHistory>} [lastSyncMap] - Optional map of catalogId to its last sync history.
   * @returns {CatalogDto[]} The list of mapped CatalogDto objects.
   */
  public static toDtoList(
    entities: Catalog[],
    lastSyncMap?: Map<string, CatalogSyncHistory>,
  ): CatalogDto[] {
    return entities.map((entity) =>
      this.toDto(entity, lastSyncMap?.get(entity.id)),
    );
  }
}