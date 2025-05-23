/**
 * Defines the basic structure for an incoming raw analytics data point,
 * including common contextual fields and a flexible payload.
 */
export interface IAnalyticsDataPoint {
  /**
   * Identifier for the merchant this data point belongs to.
   */
  merchantId: string;
  /**
   * Timestamp of when the event occurred.
   */
  eventTimestamp: Date;
  /**
   * Type of the event (e.g., 'sale', 'ad_click', 'page_view').
   */
  eventType: string;
  /**
   * Source of the event (e.g., 'GoogleAds', 'InternalOrder', 'TikTokPixel').
   */
  eventSource: string;
  /**
   * Actual data associated with the event.
   */
  payload: Record<string, any>;
}