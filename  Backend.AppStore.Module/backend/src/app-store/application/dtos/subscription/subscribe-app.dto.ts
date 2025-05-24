import { IsUUID, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum AppBillingCycle {
    MONTHLY = 'monthly',
    ANNUAL = 'annual',
}

export class SubscribeAppDto {
  @IsUUID()
  @IsNotEmpty()
  appId: string;

  @IsUUID()
  @IsNotEmpty()
  installationId: string; // Link to the installation record

  @IsEnum(AppBillingCycle)
  @IsNotEmpty()
  billingCycle: AppBillingCycle;

  // Payment details (e.g., paymentMethodId) might be handled by a separate flow
  // or included here if directly processing payment. For now, assume it's handled
  // by the PlatformBillingClient based on merchant's stored payment methods.
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}