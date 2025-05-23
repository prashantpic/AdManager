import { Catalog } from '../../catalog/catalog.aggregate';
import { Product } from '../../product/product.entity';
import { FeedFormat } from '../enums/feed-format.enum';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Common.Interfaces
 * Feed generator strategy interface.
 * Defines a contract for services that generate product catalog feeds in various formats,
 * allowing for different generation strategies.
 */
export interface IFeedGenerator {
  /**
   * Generates the feed content as a string.
   * @param {Catalog} catalog - The catalog for which to generate the feed.
   * @param {Product[]} products - The list of products to include in the feed (after applying rules and overrides).
   * @returns {Promise<string>} The generated feed content.
   */
  generate(catalog: Catalog, products: Product[]): Promise<string>;

  /**
   * Checks if this generator supports the given feed format.
   * @param {FeedFormat} format - The feed format to check.
   * @returns {boolean} True if the format is supported, false otherwise.
   */
  supports(format: FeedFormat): boolean;
}

export const IFeedGenerator = Symbol('IFeedGenerator');