import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CancelRecurringPaymentDto {
  @IsNotEmpty()
  @IsString()
  gatewaySubscriptionId: string;

  @IsUUID()
  merchantId: string; // Needed for context/permissions
}