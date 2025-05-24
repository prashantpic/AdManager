import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType } from '../common/enums/plan-type.enum';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

export class PricingTierDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(BillingCycle)
  cycle: BillingCycle;
}

export class FeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UsageLimitDto {
  @IsString()
  @IsNotEmpty()
  featureKey: string;

  @IsNumber()
  @Min(-1) // -1 for unlimited
  limit: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features: FeatureDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsageLimitDto)
  usageLimits: UsageLimitDto[];

  @IsString()
  @IsNotEmpty()
  supportLevel: string;
}