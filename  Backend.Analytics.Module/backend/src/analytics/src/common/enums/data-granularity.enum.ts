/**
 * Enumerates supported data granularity levels (e.g., Hourly, Daily) for analytics.
 */
export enum DataGranularity {
  /**
   * Individual event level data, not aggregated by time.
   */
  RAW_EVENT = "raw_event",
  /**
   * Data aggregated at an hourly level.
   */
  HOURLY = "hourly",
  /**
   * Data aggregated at a daily level.
   */
  DAILY = "daily",
}