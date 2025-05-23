export namespace AdManager.Platform.Backend.ProductCatalog.Domain.Common {
  /**
   * Enum for supported advertising platforms within the Product Catalog domain.
   * Defines a constrained list of advertising platforms that a product catalog can be designated for promotion on.
   * @version 1.0.0
   * @stability Production
   */
  export enum AdPlatform {
    GOOGLE = 'google',
    INSTAGRAM = 'instagram', // As per spec; Facebook often implies Instagram too or is separate
    TIKTOK = 'tiktok',
    SNAPCHAT = 'snapchat',
    // FACEBOOK = 'facebook', // Consider if explicitly needed separate from Instagram
  }
}