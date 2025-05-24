export const DEFAULT_SHIPPING_TIMEOUT_MS = 5000; // 5 seconds default timeout for provider API calls
export const MAX_PARCEL_WEIGHT_KG = 150; // Example max weight for a single parcel in KG
export const MAX_PARCEL_WEIGHT_LB = 330; // Example max weight for a single parcel in LB

export const DEFAULT_WEIGHT_UNIT = 'KG'; // 'KG' or 'LB'
export const DEFAULT_DIMENSION_UNIT = 'CM'; // 'CM' or 'IN'

export const FALLBACK_RATE_ID_PREFIX = 'fallback_rate_';
export const CACHED_RATE_KEY_PREFIX = 'shipping:cached_rates:';
export const SELECTED_RATE_CACHE_KEY_PREFIX = 'shipping:selected_rate:';
export const SELECTED_RATE_CACHE_TTL_SECONDS = 300; // 5 minutes for selected rate before label generation