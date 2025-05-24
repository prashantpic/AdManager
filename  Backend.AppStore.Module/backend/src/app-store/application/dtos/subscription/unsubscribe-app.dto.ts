import { IsUUID, IsNotEmpty } from 'class-validator';

export class UnsubscribeAppDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string; // The ID of the AppMerchantSubscriptionEntity record
}