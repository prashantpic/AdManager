import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class ProcessRefundDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @IsString()
  @IsOptional() // If refunding specific transaction
  gatewayTransactionId?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional() // If not provided, service might calculate full amount of last payment or transaction
  amount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}