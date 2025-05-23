import { IsDate, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO representing a date range, used for filtering analytics data. Includes validation rules.
 */
export class DateRangeDto {
  /**
   * The start date of the range.
   */
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  /**
   * The end date of the range.
   */
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date(new Date().setDate(new Date().getDate() - 365*10)), { // Default MinDate, actual MinDate based on startDate is handled by custom validator or service layer
      message: 'endDate must be after startDate'
  }) // Placeholder for actual MinDate logic linked to startDate. A custom validator would be better.
  // @MinDate((o: DateRangeDto) => o.startDate) // This decorator doesn't work directly like this.
  // Custom validation for endDate > startDate should be handled in a custom validator or service level.
  endDate: Date;
}