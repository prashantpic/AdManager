import { IsString, IsOptional, IsEnum, IsDate, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionChangeType {
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
  CANCELLED = 'CANCELLED',
  REACTIVATED = 'REACTIVATED',
  PLAN_UPDATED = 'PLAN_UPDATED', // e.g. admin changed plan features
  NEW_SUBSCRIPTION = 'NEW_SUBSCRIPTION',
}

export class SubscriptionChangedEventDto {
  @IsString()
  merchantId: string;

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.changeType !== SubscriptionChangeType.NEW_SUBSCRIPTION)
  oldPlanId: string | null;

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.changeType !== SubscriptionChangeType.CANCELLED)
  newPlanId: string | null;

  @IsEnum(SubscriptionChangeType)
  changeType: SubscriptionChangeType;

  @IsDate()
  @Type(() => Date)
  effectiveDate: Date;

  // Optional: if plan definitions are simple and small, they could be passed along
  // newPlanFeatures?: Array<{ featureKey: string, isEnabled: boolean, limit?: number }>;
  // oldPlanFeatures?: Array<{ featureKey: string, isEnabled: boolean, limit?: number }>;
}