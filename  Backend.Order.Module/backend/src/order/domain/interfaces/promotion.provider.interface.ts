// Data structure for items passed to the promotion provider
export interface PromotionOrderItemContext {
    productId: string;
    quantity: number;
    unitPrice: number; // Price before any item-specific discounts
    // categoryId?: string; // If promotions are category-specific
}

// Context required by the promotion provider to validate/apply promotions
export interface PromotionValidationOrderContext {
    items: PromotionOrderItemContext[];
    customerId?: string; // For customer-specific promotions
    merchantId: string;
    shippingAddress?: any; // For location-based promotions (e.g., free shipping to certain areas)
    // subTotal?: number; // Current subtotal before this promotion is applied
}

// Result from the promotion provider
export interface PromotionValidationResult {
    promotionId: string; // ID of the applied promotion rule/entity
    code?: string; // The code used, if applicable
    description: string; // User-friendly description of the applied discount
    discountAmount: number; // Total discount amount this promotion provides for the given context
    // Optionally, break down how the discount applies:
    // itemDiscounts?: { productId: string, discountPerUnit: number, totalDiscount: number }[];
    // shippingDiscount?: number;
    // orderLevelDiscount?: number;
    // freebieProductIds?: string[]; // If promotion grants free items
}

export const IPromotionProvider = Symbol('IPromotionProvider');

export interface IPromotionProvider {
  /**
   * Validates a promotion code (or an automatically applied promotion) against the current order context.
   * Returns details of the promotion if valid and applicable, including the calculated discount amount.
   * @param promotionCode The promotion code string entered by the user, or an identifier for an auto-applied promotion.
   * @param orderContext The current state of the order (items, customer, etc.).
   * @returns A Promise resolving to PromotionValidationResult if the promotion is valid and applicable, otherwise null.
   */
  validatePromotion(promotionCode: string, orderContext: PromotionValidationOrderContext): Promise<PromotionValidationResult | null>;

  // Potential extension: Get all applicable automatic promotions for an order context
  // getApplicableAutomaticPromotions(orderContext: PromotionValidationOrderContext): Promise<PromotionValidationResult[]>;
}