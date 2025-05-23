import { ReportRequestDto } from '../dtos/report-request.dto';

/**
 * Interface describing the structure of a predefined report template,
 * including its metadata and default generation parameters.
 */
export interface IPredefinedReportTemplate {
  /**
   * Unique identifier for the report template.
   */
  templateId: string;

  /**
   * User-friendly name of the template (e.g., 'Monthly Sales Summary', 'Ad Campaign ROAS Overview').
   */
  name: string;

  /**
   * Brief description of what the report template provides.
   */
  description: string;

  /**
   * Category of the report (e.g., 'Sales', 'Advertising', 'Customer').
   */
  category: string;

  /**
   * Default parameters (like metrics, dimensions, default date range preset) for this template.
   */
  defaultParameters: Partial<ReportRequestDto>;
}