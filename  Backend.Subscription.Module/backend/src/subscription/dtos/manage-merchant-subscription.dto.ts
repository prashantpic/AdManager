import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

export class ManageMerchantSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsString()
  @IsNotEmpty() // Required for new subscriptions, optional for changes if already stored
  @IsOptional() // Making it optional at DTO level; service logic will enforce if new.
  paymentMethodToken?: string;
}