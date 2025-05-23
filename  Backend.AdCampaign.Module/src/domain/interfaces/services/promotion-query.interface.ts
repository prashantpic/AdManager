// Define a minimal Promotion structure expected by this module
export interface PromotionData {
  id: string;
  name: string;
  // Add other relevant promotion fields
  type?: string; // e.g., 'DISCOUNT', 'BOGO'
  discountValue?: number;
  discountPercentage?: number;
  description?: string;
}

export interface IPromotionQueryService {
  getPromotionsByIds(
    merchantId: string,
    promotionIds: string[],
  ): Promise<PromotionData[]>;

  validatePromotionIds(
    merchantId: string,
    promotionIds: string[],
  ): Promise<{ validIds: string[]; invalidIds: string[] }>;

  // Potentially validate applicability if complex rules exist
  // validatePromotionApplicability(
  //   merchantId: string,
  //   promotionId: string,
  //   context: { productIds?: string[]; orderValue?: number }, // Example context
  // ): Promise<boolean>;
}

export const IPromotionQueryService = Symbol('IPromotionQueryService');