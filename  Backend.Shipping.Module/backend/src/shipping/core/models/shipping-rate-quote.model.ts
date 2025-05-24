import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, IsArray, ValidateNested, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CarrierCode } from '../enums/carrier-code.enum';
import { v4 as uuidv4 } from 'uuid';

export class SurchargeModel {
  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ShippingRateQuoteModel {
  @IsString()
  id: string = uuidv4();

  @IsEnum(CarrierCode)
  carrierCode: CarrierCode;

  @IsString()
  serviceName: string;

  @IsString()
  serviceCode: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedDeliveryDateMin?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedDeliveryDateMax?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryDays?: number;

  @IsOptional()
  @IsBoolean()
  isNegotiatedRate?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurchargeModel)
  surcharges?: SurchargeModel[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  originalProviderRate?: any; // Store provider-specific rate object if needed for label creation
}