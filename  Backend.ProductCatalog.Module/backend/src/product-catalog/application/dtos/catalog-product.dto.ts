/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Dtos
 * DTO for product details within a catalog context, including overrides.
 * Defines the structure of product data as it appears in catalog feeds or when displaying products
 * associated with a catalog, including any overrides.
 * Used to transfer complete product information required for catalog feeds,
 * merging base product data with catalog-specific customizations.
 */
export class CatalogProductDto {
  /**
   * @member {string} id - Product ID.
   */
  id: string;

  /**
   * @member {string} title - Product title.
   */
  title: string;

  /**
   * @member {string} description - Product description.
   */
  description: string;

  /**
   * @member {number} price - Product price.
   */
  price: number;

  /**
   * @member {string} currency - Product currency code (e.g., USD, EUR).
   */
  currency: string;

  /**
   * @member {string} availability - Product availability status (e.g., in stock, out of stock).
   */
  availability: string; // Consider using an enum if specific values are defined

  /**
   * @member {string} imageUrl - URL of the main product image.
   */
  imageUrl: string;

  /**
   * @member {string} productUrl - URL of the product page on the merchant's site.
   */
  productUrl: string;

  /**
   * @member {string} [brand] - Product brand.
   */
  brand?: string;

  /**
   * @member {string} [gtin] - Global Trade Item Number.
   */
  gtin?: string;

  /**
   * @member {string} [mpn] - Manufacturer Part Number.
   */
  mpn?: string;

  /**
   * @member {string} [category] - Product category.
   */
  category?: string;

  /**
   * @member {number} stockLevel - Current stock level of the product.
   */
  stockLevel: number;

  /**
   * @member {string} [customTitle] - Catalog-specific override for the product title.
   */
  customTitle?: string;

  /**
   * @member {string} [customDescription] - Catalog-specific override for the product description.
   */
  customDescription?: string;
}