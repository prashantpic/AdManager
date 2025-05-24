import { IsInt, Min, IsArray, ArrayMinSize, IsOptional, IsBoolean, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DunningParametersDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxRetries: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  retryIntervalsDays: number[]; // e.g., [3, 5, 7] days after last failure

  @IsOptional()
  @IsBoolean()
  notifyCustomerOnFailure?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['cancel_subscription', 'mark_unpaid'])
  finalActionOnExhaustedRetries?: 'cancel_subscription' | 'mark_unpaid';
}