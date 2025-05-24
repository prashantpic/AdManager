export interface ProductDetails {
  id: string;
  name: string;
  price: number; // Price at the time of query. Ensure currency consistency.
  // Potentially other fields needed for order processing:
  // sku?: string;
  // weight?: number; // For shipping calculations
  // dimensions?: { length: number; width: number; height: number }; // For shipping
  // imageUrl?: string; // For display in order summaries
  // taxCode?: string; // For tax calculations
}

export const IProductProvider = Symbol('IProductProvider');

export interface IProductProvider {
  /**
   * Fetches essential details for a single product.
   * @param productId The ID of the product.
   * @returns A Promise resolving to ProductDetails or null if not found.
   */
  getProductDetails(productId: string): Promise<ProductDetails | null>;

  /**
   * Checks the current stock availability for a given product and quantity.
   * This method should confirm if the requested quantity can be fulfilled.
   * @param productId The ID of the product.
   * @param quantity The quantity requested.
   * @returns A Promise resolving to true if stock is sufficient, false otherwise.
   */
  checkStockAvailability(productId: string, quantity: number): Promise<boolean>;

  // Optional: Batch operations for efficiency if many products are involved
  // getMultipleProductDetails(productIds: string[]): Promise<ProductDetails[]>;
  // checkMultipleStockAvailability(items: { productId: string; quantity: number }[]): Promise<{ productId: string; isAvailable: boolean }[]>;
}