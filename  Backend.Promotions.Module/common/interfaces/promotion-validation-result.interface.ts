/**
 * REQ-PM-008: Real-time validation requires a standardized result structure.
 */
export interface IPromotionValidationResult {
  isValid: boolean;
  failureReason?: string; // A code or key for the reason (e.g., 'EXPIRED', 'MIN_PURCHASE_NOT_MET')
  message?: string; // A human-readable message explaining why validation failed or succeeded
  
  /**
   * Optional: Details of specific rules that failed.
   * e.g., [{ ruleType: 'MIN_PURCHASE', reason: 'Subtotal $50 is less than required $100' }]
   */
  ruleViolations?: Array<{ ruleType: string; reason: string; required?: any; actual?: any }>;

  /**
   * Optional: For complex promotions like BOGO, this could preview which items *would* be affected
   * if the promotion were to be applied. This helps in UI previews.
   * This might be simplified to just the potential discount amount or a descriptive text.
   */
  // previewApplicableItems?: Array<{ itemId: string; quantity: number; originalPrice: number; discountedPrice: number }>;

  /**
   * Optional: The potential discount amount if this promotion were applied.
   * Useful for display before final application or for the rules engine to estimate impact.
   * For non-monetary promotions (e.g., free gift), this might be 0 or a nominal value.
   */
  applicableDiscountValue?: number;
}