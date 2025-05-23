/**
 * Interface for analytics events after they have undergone initial processing and structuring.
 */
export interface IProcessedEvent {
  /**
   * Identifier for the merchant this event belongs to.
   */
  merchantId: string;
  /**
   * Timestamp of when the event occurred.
   */
  eventTime: Date;
  /**
   * Type of the event.
   */
  eventType: string;
  /**
   * Key-value pairs describing the event context, e.g., campaignId, productId, country.
   */
  dimensions: Record<string, string | number | boolean>;
  /**
   * Key-value pairs of quantitative measures, e.g., revenue, cost, clicks.
   */
  metrics: Record<string, number>;
}