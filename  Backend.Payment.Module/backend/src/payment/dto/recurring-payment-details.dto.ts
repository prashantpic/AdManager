import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class RecurringPaymentDetailsDto {
  @IsString()
  gatewaySubscriptionId: string;

  @IsString()
  status: string; // Gateway-specific status

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  currentPeriodStart?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  currentPeriodEnd?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextBillingDate?: Date;

  // Non-sensitive raw response details from gateway about the plan.
  planDetails: Record<string, any>;
}