import { IsNumber, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { DEFAULT_WEIGHT_UNIT, DEFAULT_VOLUME_UNIT } from '../../common/constants/shipping.constants';

export class ParcelModel {
  @IsNumber()
  @Min(0)
  weight: number;

  @IsString()
  @MaxLength(5)
  weightUnit: string = DEFAULT_WEIGHT_UNIT; // e.g., KG, LB

  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsString()
  @MaxLength(5)
  dimensionUnit: string = DEFAULT_VOLUME_UNIT; // e.g., CM, IN

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string; // e.g., USD, SAR
}