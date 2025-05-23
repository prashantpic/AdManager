/**
 * Enumerates supported file formats for exporting reports.
 */
export enum ReportExportFormat {
  /**
   * Export report data as JSON.
   */
  JSON = "json",
  /**
   * Export report data as CSV file.
   */
  CSV = "csv",
  /**
   * Export report data as Excel (XLSX) file.
   */
  XLSX = "xlsx",
}