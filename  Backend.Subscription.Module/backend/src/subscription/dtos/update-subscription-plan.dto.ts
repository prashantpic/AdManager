import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingTierDto, FeatureDto, UsageLimitDto } from './create-subscription-plan.dto';
import { PlanType } from '../common/enums/plan-type.enum';

export class UpdateSubscriptionPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PlanType)
  @IsOptional()
  type?: PlanType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  @IsOptional()
  pricingTiers?: PricingTierDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  @IsOptional()
  features?: FeatureDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsageLimitDto)
  @IsOptional()
  usageLimits?: UsageLimitDto[];

  @IsString()
  @IsOptional()
  supportLevel?: string;
}