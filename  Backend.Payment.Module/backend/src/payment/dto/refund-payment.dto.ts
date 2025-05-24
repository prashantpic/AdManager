import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class RefundPaymentDto {
  @IsNotEmpty()
  @IsString()
  gatewayTransactionId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  // Partial refund amount, if not full refund.
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsUUID()
  merchantId: string; // Needed for context/permissions
}