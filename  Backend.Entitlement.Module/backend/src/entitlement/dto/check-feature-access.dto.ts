import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { FeatureKey } from '../constants/feature.constants';

export class CheckFeatureAccessDto {
  @IsString()
  merchantId: string;

  @IsEnum(FeatureKey)
  featureKey: FeatureKey;

  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedUsage?: number; // The amount the user *wants* to use (e.g., 1 for creating one item)

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentUsage?: number; // Allows the caller to provide current usage
}