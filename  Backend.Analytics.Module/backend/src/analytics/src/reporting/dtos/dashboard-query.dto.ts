import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DateRangeDto } from '../../common/dtos/date-range.dto';
import { DataGranularity } from '../../common/enums/data-granularity.enum';

/**
 * DTO for requesting data to populate analytics dashboards,
 * specifying type, date range, filters, and granularity.
 */
export class DashboardQueryDto {
  /**
   * Identifier for the specific dashboard type being requested.
   */
  @IsString()
  @IsNotEmpty()
  dashboardType: string;

  /**
   * The date range for the dashboard data.
   */
  @ValidateNested()
  @Type(() => DateRangeDto)
  @IsNotEmpty()
  dateRange: DateRangeDto;

  /**
   * Key-value pairs for filtering the dashboard data.
   */
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  /**
   * Desired time granularity for the dashboard data.
   * @default DataGranularity.DAILY
   */
  @IsEnum(DataGranularity)
  @IsOptional()
  granularity?: DataGranularity = DataGranularity.DAILY;
}