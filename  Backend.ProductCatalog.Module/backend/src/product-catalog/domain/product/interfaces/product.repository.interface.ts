import { Product } from '../product.entity';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Product.Interfaces
 * Product repository interface for catalog context.
 * Abstracts data persistence operations for Product entities as they are used within the Product Catalog bounded context.
 * Defines the contract for product data access.
 */
export interface IProductRepository {
  /**
   * Finds products by their IDs and merchant ID.
   * @param {string[]} ids - An array of product IDs.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<Product[]>} A list of found products.
   */
  findByIdsAndMerchantId(ids: string[], merchantId: string): Promise<Product[]>;

  /**
   * Finds all products belonging to a specific merchant.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<Product[]>} A list of products.
   */
  findAllByMerchantId(merchantId: string): Promise<Product[]>;

  /**
   * Finds all products associated with a specific catalog for a merchant.
   * This typically involves looking at CatalogProductItem entries.
   * @param {string} catalogId - The ID of the catalog.
   * @param {string} merchantId - The ID of the merchant.
   * @returns {Promise<Product[]>} A list of products in the catalog.
   */
  findProductsForCatalog(
    catalogId: string,
    merchantId: string,
  ): Promise<Product[]>;

  /**
   * Saves a product (creates or updates).
   * @param {Product} product - The product entity to save.
   * @returns {Promise<Product>} The saved product entity.
   */
  save(product: Product): Promise<Product>;

  /**
   * Saves multiple products (creates or updates).
   * @param {Product[]} products - An array of product entities to save.
   * @returns {Promise<Product[]>} An array of the saved product entities.
   */
  saveMany(products: Product[]): Promise<Product[]>;
}

export const IProductRepository = Symbol('IProductRepository');