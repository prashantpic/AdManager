import { PromotionContextDto } from '../dtos/promotion-context.dto';
import { AppliedPromotionDto } from '../dtos/applied-promotion.dto';
import { IPromotionValidationResult } from './promotion-validation-result.interface';
import { OfferType, PromotionStatus, StackingBehavior } from '../enums/promotion.enums';

/**
 * REQ-PM-014: Implements a promotion hierarchy and rules engine for applying multiple offers.
 * This interface allows polymorphic handling of different promotion types by the rules engine.
 */
export interface IPromotion {
  getId(): string;
  getName(): string;
  getType(): OfferType;
  getStatus(): PromotionStatus;
  getValidityPeriod(): { startDate: Date | null; endDate: Date | null } | null;

  /**
   * Provides the raw rule data for this promotion.
   * The structure of the returned object will vary depending on the promotion type.
   */
  getApplicabilityRules(): any;

  getStackingBehavior(): StackingBehavior;
  getPriority(): number; // Lower number = higher priority

  /**
   * Checks basic validity (status, dates, general non-contextual rules).
   * @param context The promotion context.
   */
  isValid(context: PromotionContextDto): Promise<IPromotionValidationResult>; // Made async as some checks might need DB

  /**
   * Checks detailed applicability against the provided context (items, customer, totals).
   * @param context The promotion context.
   */
  isApplicable(context: PromotionContextDto): Promise<IPromotionValidationResult>; // Made async

  /**
   * Calculates the discount or effect of the promotion based on the context and rules.
   * This method should NOT have side effects (e.g., incrementing usage counts).
   * It should return an array as one promotion (like BOGO "Buy X Get Y and Z") might result in multiple "effects"
   * or apply to multiple items distinctly.
   * @param context The promotion context.
   * @returns An array of AppliedPromotionDto representing the effects, or an empty array/null if not applied.
   */
  apply(context: PromotionContextDto): Promise<AppliedPromotionDto[] | null>; // Made async

  /**
   * Provides a human-readable description of the promotion's effect.
   */
  getEffectDescription(): string;

  /**
   * Determines if this promotion can stack with another given promotion.
   * This logic might be simple (based on own stackingBehavior) or complex (checking specific IDs/types).
   * @param otherPromotion The other promotion to check against.
   */
  canStackWith(otherPromotion: IPromotion): boolean;

  /**
   * Returns the usage limits for this promotion.
   */
  getUsageLimits(): { totalUses: number | null; usesPerCustomer: number | null };

  /**
   * Returns the current usage data for this promotion. Requires fetching from repository/tracking.
   * This might be intensive if called frequently.
   */
  getCurrentUsage(context?: PromotionContextDto): Promise<{ // Context might be needed for per-customer usage
    totalUses: number;
    usesPerCustomerMap?: Record<string, number>; // Key: customerId, Value: count
    customerUsageInContext?: number; // Usage by current customer in context
  }>;
}