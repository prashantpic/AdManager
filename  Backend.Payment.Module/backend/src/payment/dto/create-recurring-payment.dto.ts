import { IsUUID, IsString, IsNotEmpty, IsNumber, Min, IsISO4217CurrencyCode, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecurringPaymentDto {
  @IsUUID()
  merchantId: string;

  @IsString()
  @IsNotEmpty() // Assuming customer ID is internal platform ID, not necessarily UUID
  customerId: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodToken: string;

  @IsString()
  @IsNotEmpty() // Identifier for the recurring plan at the gateway or internally mapped.
  planId: string;

  @IsNumber()
  @Min(0) // Can be 0 for free trials, etc.
  @Type(() => Number)
  amount: number;

  @IsISO4217CurrencyCode()
  currency: string;

  @IsString()
  @IsIn(['day', 'week', 'month', 'year'])
  interval: string; // e.g., 'month'

  @IsInt()
  @Min(1)
  @Type(() => Number)
  intervalCount: number; // e.g., 1 for monthly, 3 for quarterly
}