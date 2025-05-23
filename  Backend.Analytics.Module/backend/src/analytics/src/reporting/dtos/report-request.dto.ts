import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeDto } from '../../common/dtos/date-range.dto';
import { AttributionModel } from '../../common/enums/attribution-model.enum';
import { ReportExportFormat } from '../../common/enums/report-export-format.enum';

/**
 * DTO specifying the criteria for generating a custom analytics report,
 * including date range, dimensions, metrics, and filters.
 */
export class ReportRequestDto {
  /**
   * Identifier for the type of report (e.g., 'SalesPerformance', 'AdCampaignSummary').
   */
  @IsString()
  @IsNotEmpty()
  reportType: string;

  /**
   * The date range for the report.
   */
  @ValidateNested()
  @Type(() => DateRangeDto)
  @IsNotEmpty()
  dateRange: DateRangeDto;

  /**
   * List of dimensions to group by (e.g., 'campaignId', 'country').
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dimensions?: string[];

  /**
   * List of metrics to include (e.g., 'ROAS', 'totalSales').
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  metrics: string[];

  /**
   * Key-value pairs for filtering the data.
   */
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  /**
   * Attribution model to apply.
   */
  @IsEnum(AttributionModel)
  @IsOptional()
  attributionModel?: AttributionModel;

  /**
   * Desired format for report export.
   * @default ReportExportFormat.JSON
   */
  @IsEnum(ReportExportFormat)
  @IsOptional()
  exportFormat?: ReportExportFormat = ReportExportFormat.JSON;
}