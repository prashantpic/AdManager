// Default usage limits, default priorities, error message keys/templates,
// feature flag keys, configuration keys.

export const DEFAULT_PROMOTION_PRIORITY = 100;

export const PROMOTION_CONFIG_KEYS = {
  MAX_COMBINED_DISCOUNT_PERCENT: 'promotions.maxCombinedDiscountPercent',
  DEFAULT_STACKING_BEHAVIOR: 'promotions.defaultStackingBehavior',
  CSV_IMPORT_BATCH_SIZE: 'promotions.csvImportBatchSize',
  MAX_DISCOUNT_CODE_GENERATION_BATCH: 'promotions.maxDiscountCodeGenerationBatch',
};

export const PROMOTION_FEATURE_FLAGS = {
  ENABLE_ADVANCED_BOGO: 'promotions.enableAdvancedBogoConditions',
  ENABLE_COMPLEX_STACKING_RULES: 'promotions.enableComplexStackingRules',
  ENABLE_PROMOTION_PREVIEW_SIMULATION: 'promotions.enablePromotionPreviewSimulation',
};

// Example error message keys (actual messages might be in a localization file)
export const PROMOTION_ERROR_KEYS = {
  PROMOTION_NOT_FOUND: 'error.promotion.notFound',
  PROMOTION_NOT_APPLICABLE: 'error.promotion.notApplicable',
  INVALID_PROMOTION_CODE: 'error.promotion.invalidCode',
  PROMOTION_EXPIRED: 'error.promotion.expired',
  PROMOTION_USAGE_LIMIT_EXCEEDED: 'error.promotion.usageLimitExceeded',
  PROMOTION_INACTIVE: 'error.promotion.inactive',
  STACKING_CONFLICT: 'error.promotion.stackingConflict',
  BULK_GENERATION_FAILED: 'error.promotion.bulkGenerationFailed',
  IMPORT_EXPORT_FAILED: 'error.promotion.importExportFailed',
  INVALID_PROMOTION_DATA: 'error.promotion.invalidData',
  MIN_PURCHASE_NOT_MET: 'error.promotion.minPurchaseNotMet',
};