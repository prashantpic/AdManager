/**
 * A collection of shared, immutable constant values for the Analytics module.
 */
export const METRIC_ROAS = "ROAS";
export const METRIC_CPA = "CPA";
export const METRIC_CPC = "CPC";
export const METRIC_CTR = "CTR";
export const METRIC_CONVERSION_RATE = "ConversionRate";
export const METRIC_AOV = "AOV";

export const DEFAULT_DATE_RANGE = "last_30_days";

export const EXPORT_FORMAT_CSV = "csv";
export const EXPORT_FORMAT_EXCEL = "xlsx";
export const EXPORT_FORMAT_JSON = "json"; // Added as per SDS 5.3 DTOs

export const DASHBOARD_TYPE_SALES = "SalesOverview";
export const DASHBOARD_TYPE_AD_PERFORMANCE = "AdPerformance";
export const DASHBOARD_TYPE_CUSTOMER_BEHAVIOR = "CustomerBehavior"; // Added based on SDS DashboardDataService
export const DASHBOARD_TYPE_AFFILIATE_PERFORMANCE = "AffiliatePerformance"; // Added based on SDS DashboardDataService
export const DASHBOARD_TYPE_DISCOUNT_EFFECTIVENESS = "DiscountEffectiveness"; // Added based on SDS DashboardDataService
export const DASHBOARD_TYPE_PROMOTED_LISTING = "PromotedListing"; // Added based on SDS DashboardDataService
export const DASHBOARD_TYPE_INTERNAL_OPERATIONAL = "InternalOperational"; // Added based on SDS DashboardsController

export const SQS_ANALYTICS_INGESTION_QUEUE = "analytics_ingestion_queue"; // Default name if not from config