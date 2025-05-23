export namespace AdManager.Platform.Backend.ProductCatalog.Domain.Common {
  /**
   * Enum for out-of-stock handling options within the Product Catalog domain.
   * Defines how out-of-stock items are treated in product feeds, based on merchant configuration.
   * @version 1.0.0
   * @stability Production
   */
  export enum OutOfStockHandling {
    EXCLUDE_FROM_FEED = 'exclude_from_feed',
    MARK_AS_OUT_OF_STOCK = 'mark_as_out_of_stock', // Set availability to 'out of stock'
    ALLOW_TEMPORARILY = 'allow_temporarily', // Allow for a configured number of days, then revert to other rule
  }
}