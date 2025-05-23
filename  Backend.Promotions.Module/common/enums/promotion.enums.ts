/**
 * REQ-PM-001: Customizable discount codes (percentage, fixed amount, free shipping).
 * REQ-PM-002: Manages discount lifecycle.
 * REQ-PM-008: Real-time validation.
 * REQ-PM-013: General offers.
 * REQ-PM-015: Handling stackability.
 */

export enum DiscountCodeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SCHEDULED = 'SCHEDULED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED', // REQ-PM-002 might imply this for lifecycle management
}

export enum StackingBehavior {
  STACKABLE = 'STACKABLE', // Can be combined with any other stackable promotion
  NON_STACKABLE = 'NON_STACKABLE', // Cannot be combined with any other promotion
  STACK_WITH_SPECIFIC_PROMOTIONS = 'STACK_WITH_SPECIFIC_PROMOTIONS', // Can only stack with a defined list
  // NON_STACKABLE_WITH_ALL was in previous version, simplified to NON_STACKABLE as per SDS 3.3
  // PRIORITY_BASED logic handled by rules engine, not a behavior of a single promo.
}

export enum OfferType {
  DISCOUNT_CODE = 'DISCOUNT_CODE',
  BOGO = 'BOGO', // Buy One Get One
  QUANTITY_DISCOUNT = 'QUANTITY_DISCOUNT',
  GENERAL_OFFER = 'GENERAL_OFFER', // e.g., free gift, sitewide discount without code
}

export enum DiscountTarget {
  ORDER_TOTAL = 'ORDER_TOTAL',
  SPECIFIC_ITEMS = 'SPECIFIC_ITEMS',
  SHIPPING = 'SHIPPING',
}

export enum ApplicabilityType {
  ALL_PRODUCTS = 'ALL_PRODUCTS',
  SPECIFIC_PRODUCTS = 'SPECIFIC_PRODUCTS',
  SPECIFIC_COLLECTIONS = 'SPECIFIC_COLLECTIONS',
  CUSTOMER_SEGMENTS = 'CUSTOMER_SEGMENTS',
  NEW_CUSTOMERS_ONLY = 'NEW_CUSTOMERS_ONLY',
  MIN_PURCHASE_AMOUNT = 'MIN_PURCHASE_AMOUNT',
  MIN_QUANTITY = 'MIN_QUANTITY',
  FIRST_ORDER_ONLY = 'FIRST_ORDER_ONLY',
  GEOGRAPHIC_AREA = 'GEOGRAPHIC_AREA',
  DEVICE_TYPE = 'DEVICE_TYPE', // e.g., mobile, desktop
  CHANNEL = 'CHANNEL', // e.g., web, mobile_app
}

// Enums for BOGO Promotions (REQ-PM-010)
export enum BogoBuyConditionType {
  ITEM = 'ITEM', // Buy specific item(s)
  COLLECTION = 'COLLECTION', // Buy item(s) from specific collection(s)
  LEAST_EXPENSIVE_ITEM = 'LEAST_EXPENSIVE_ITEM', // (Advanced) Buy any X items, get least expensive free/discounted
}

export enum BogoGetType {
  ITEM = 'ITEM', // Get specific item(s)
  COLLECTION = 'COLLECTION', // Get item(s) from specific collection(s)
  LEAST_EXPENSIVE_ITEM = 'LEAST_EXPENSIVE_ITEM', // Get the least expensive of qualifying items free/discounted
}

export enum BogoOfferValueType {
  FREE = 'FREE',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_AMOUNT_DISCOUNT = 'FIXED_AMOUNT_DISCOUNT',
}

// Enums for Quantity Discounts (REQ-PM-017, REQ-PM-018)
export enum QuantityTierValueType {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_AMOUNT_DISCOUNT = 'FIXED_AMOUNT_DISCOUNT',
}