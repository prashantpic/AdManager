/**
 * Enumerates the supported attribution models (e.g., Last Click, First Click, Linear) for analytics reporting.
 */
export enum AttributionModel {
  /**
   * Attributes 100% of the conversion to the last touchpoint.
   */
  LAST_CLICK = "last_click",
  /**
   * Attributes 100% of the conversion to the first touchpoint.
   */
  FIRST_CLICK = "first_click",
  /**
   * Distributes conversion credit equally across all touchpoints.
   */
  LINEAR = "linear",
}