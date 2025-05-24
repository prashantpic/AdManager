import { CarrierCode } from '../../core/enums/carrier-code.enum';

export enum RuleActionCostAdjustmentType {
  FIXED_ADD = 'FIXED_ADD', // Add fixed amount
  FIXED_SUBTRACT = 'FIXED_SUBTRACT', // Subtract fixed amount
  PERCENTAGE_ADD = 'PERCENTAGE_ADD', // Add percentage of original rate
  PERCENTAGE_SUBTRACT = 'PERCENTAGE_SUBTRACT', // Subtract percentage of original rate
  OVERRIDE = 'OVERRIDE', // Override with a fixed amount
}

export interface RuleActionCostAdjustment {
  type: RuleActionCostAdjustmentType;
  amount: number; // The value for adjustment or override
  currency?: string; // Required for FIXED types and OVERRIDE
}

export interface ShippingRuleActionInterface {
  /**
   * If specified, only rates from these carriers will be considered valid for this rule.
   * If empty or undefined, applies to all configured/enabled carriers.
   */
  allowedCarriers?: CarrierCode[];

  /**
   * If specified, only rates with these service codes (from allowedCarriers) will be considered.
   * If empty or undefined, applies to all services from allowedCarriers.
   */
  allowedServiceCodes?: string[];

  /**
   * Optional cost adjustment to apply to rates matching this rule.
   */
  costAdjustment?: RuleActionCostAdjustment;

  /**
   * If true, and this rule matches, no lower priority rules are considered for rate adjustments or filtering.
   * However, rates from providers not explicitly allowed by this rule might still be considered if this rule doesn't provide any rates.
   */
  isExclusive?: boolean;

  /**
   * If true, rates determined by this rule action (e.g., an OVERRIDE cost) are only used if no other
   * non-fallback rates are found from providers or higher-priority rules.
   * This is distinct from the global FallbackShippingProvider mechanism.
   */
  isRuleFallback?: boolean;

  /**
   * If true, shipping is free for rates matching this rule. Overrides costAdjustment.
   */
  offerFreeShipping?: boolean;

  /**
   * Custom message to display to the customer if this rule applies and affects rates.
   */
  displayMessage?: string;
}