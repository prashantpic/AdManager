import { Catalog } from '../catalog.aggregate';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Catalog.Interfaces
 * Catalog repository interface.
 * Abstracts data persistence operations for Catalog aggregates, enabling decoupling of domain logic from specific data storage technologies.
 * Defines the contract for catalog data access.
 */
export interface ICatalogRepository {
  /**
   * Finds a catalog by its ID.
   * @param {string} id - The ID of the catalog.
   * @returns {Promise<Catalog | null>} The catalog if found, otherwise null.
   */
  findById(id: string): Promise<Catalog | null>;

  /**
   * Finds a catalog by its ID and merchant ID.
   * @param {string} id - The ID of the catalog.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<Catalog | null>} The catalog if found and belongs to the merchant, otherwise null.
   */
  findByIdAndMerchantId(
    id: string,
    merchantId: string,
  ): Promise<Catalog | null>;

  /**
   * Finds all catalogs belonging to a specific merchant.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<Catalog[]>} A list of catalogs.
   */
  findAllByMerchantId(merchantId: string): Promise<Catalog[]>;

  /**
   * Saves a catalog (creates or updates).
   * @param {Catalog} catalog - The catalog entity to save.
   * @returns {Promise<Catalog>} The saved catalog entity.
   */
  save(catalog: Catalog): Promise<Catalog>;

  /**
   * Deletes a catalog by its ID and merchant ID.
   * @param {string} id - The ID of the catalog to delete.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<void>}
   */
  deleteByIdAndMerchantId(id: string, merchantId: string): Promise<void>;

  /**
   * Finds catalogs that are due for scheduled synchronization.
   * @param {Date} currentTime - The current time, used to determine which schedules are due.
   * @returns {Promise<Catalog[]>} A list of catalogs due for sync.
   */
  findDueForScheduledSync(currentTime: Date): Promise<Catalog[]>;
}

export const ICatalogRepository = Symbol('ICatalogRepository');