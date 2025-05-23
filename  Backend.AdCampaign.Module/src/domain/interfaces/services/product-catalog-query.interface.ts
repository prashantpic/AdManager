// Define a minimal Product structure expected by this module
export interface ProductData {
  id: string;
  name: string;
  // Add other relevant product fields needed for ad creation/display
  price?: number;
  currency?: string;
  imageUrl?: string;
  description?: string;
}

export interface IProductCatalogQueryService {
  getProductsByIds(
    merchantId: string,
    productIds: string[],
  ): Promise<ProductData[]>;

  validateProductIds(
    merchantId: string,
    productIds: string[],
  ): Promise<{ validIds: string[]; invalidIds: string[] }>;

  // Potentially a method to get details of a specific catalog if needed
  // getProductCatalogDetails(
  //   merchantId: string,
  //   catalogId: string,
  // ): Promise<any>; // Define a CatalogData interface if needed
}

export const IProductCatalogQueryService = Symbol('IProductCatalogQueryService');