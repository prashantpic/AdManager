import { IsNumber, Min, IsISO4217CurrencyCode, IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessPaymentDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsISO4217CurrencyCode()
  currency: string;

  @IsNotEmpty()
  @IsString()
  // Token representing payment details from client-side tokenization or saved payment method ID.
  paymentMethodToken: string;

  @IsUUID()
  orderId: string;

  @IsUUID()
  merchantId: string;

  @IsOptional()
  @IsString()
  description?: string;
}