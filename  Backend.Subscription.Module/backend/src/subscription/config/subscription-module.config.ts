import { IsInt, IsPositive, IsString, IsEnum } from 'class-validator';

// Define proration policy options if they are fixed
export enum ProrationPolicy {
  FULL_CREDIT = 'full_credit',
  NO_CREDIT = 'no_credit',
  PRORATED = 'prorated',
}

export class SubscriptionModuleConfig {
  @IsInt()
  @IsPositive()
  dunningRetryAttempts: number;

  @IsString()
  @IsEnum(ProrationPolicy)
  prorationPolicy: ProrationPolicy;

  @IsInt()
  @IsPositive()
  dunningRetryIntervalHours: number;

  @IsInt()
  @IsPositive()
  suspensionAfterDaysPastDue: number;

  @IsInt()
  @IsPositive()
  terminationAfterDaysSuspended: number;

  // Example: paymentGatewayIntegrationKey: string;
}