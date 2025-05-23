import { ReportRequestDto } from './report-request.dto';

/**
 * DTO representing the structured output of a generated analytics report,
 * including metadata and report data.
 */
export class ReportResponseDto {
  /**
   * Name or title of the generated report.
   */
  reportName: string;

  /**
   * Timestamp when the report was generated.
   */
  generatedAt: Date;

  /**
   * The parameters used to generate this report.
   */
  requestParameters: ReportRequestDto;

  /**
   * The actual report data, typically an array of objects.
   */
  data: any[];

  /**
   * Optional summary statistics for the report.
   */
  summary?: Record<string, any>;
}