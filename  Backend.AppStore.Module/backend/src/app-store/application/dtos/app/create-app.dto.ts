import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsEnum,
  ValidateNested,
  IsArray,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';

// Assuming AppPricing and DeveloperInfo VOs are defined in the domain layer
// For DTO purposes, we define their structure here or import a DTO version of them.

export class AppPricingDto {
  @IsEnum(AppPricingModel)
  model: AppPricingModel;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string; // e.g., 'USD'

  @IsString()
  @IsOptional()
  billingCycle?: 'monthly' | 'annual' | 'one-time';

  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;
}

export class DeveloperInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}


export class CreateAppDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsNotEmpty()
  developerId: string; // This would typically be derived from the authenticated user context

  @IsEnum(AppPricingModel)
  @IsNotEmpty()
  pricingModel: AppPricingModel;

  @ValidateNested()
  @Type(() => AppPricingDto)
  @IsOptional() // Pricing details might be optional for FREE apps or set defaults
  pricingDetails?: AppPricingDto;

  @ValidateNested()
  @Type(() => DeveloperInfoDto)
  @IsNotEmpty()
  developerInfo: DeveloperInfoDto;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  requiredPermissionIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];
}