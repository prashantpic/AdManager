import { IsString, IsObject, ValidateNested, IsOptional, IsBoolean, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { FeatureKey } from '../constants/feature.constants';

export class IFeatureEntitlementDetails {
  @IsEnum(FeatureKey)
  featureKey: FeatureKey;

  @IsBoolean()
  hasAccess: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  currentUsage?: number;

  @IsOptional()
  @IsBoolean()
  isGracePeriod?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  gracePeriodEndDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MerchantEntitlementDto {
  @IsString()
  merchantId: string;

  @IsString()
  planId: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => IFeatureEntitlementDetails)
  entitlements: { [key in FeatureKey]?: IFeatureEntitlementDetails };
}