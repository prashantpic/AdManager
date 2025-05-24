import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { CarrierCode } from '../enums/carrier-code.enum';

export class ShippingLabelModel {
  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @IsString()
  labelData: string; // Base64 encoded label file content or similar

  @IsString()
  @MaxLength(10)
  labelFormat: string; // e.g., 'PDF', 'PNG', 'ZPL'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  labelUrl?: string; // Optional URL if label is hosted

  @IsEnum(CarrierCode)
  carrierCode: CarrierCode;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shipmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rateIdUsed?: string;
}