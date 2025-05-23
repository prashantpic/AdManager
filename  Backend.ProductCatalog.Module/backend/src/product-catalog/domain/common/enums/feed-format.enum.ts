export namespace AdManager.Platform.Backend.ProductCatalog.Domain.Common {
  /**
   * Enum for supported product catalog feed formats within the Product Catalog domain.
   * Defines a constrained list of supported formats for generating and exporting product catalog feeds.
   * @version 1.0.0
   * @stability Production
   */
  export enum FeedFormat {
    CSV = 'csv',
    XML = 'xml',
    GOOGLE_MERCHANT_CENTER = 'google_merchant_center', // Typically XML, but specific schema
  }
}