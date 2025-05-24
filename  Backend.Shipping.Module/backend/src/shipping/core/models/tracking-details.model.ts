import { IsString, IsOptional, IsDate, IsArray, ValidateNested, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CarrierCode } from '../enums/carrier-code.enum';
import { TrackingEventModel } from './tracking-event.model';

export class TrackingDetailsModel {
  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @IsEnum(CarrierCode)
  carrierCode: CarrierCode;

  @IsString()
  @MaxLength(100)
  currentStatus: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  statusDescription?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedDeliveryDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingEventModel)
  events: TrackingEventModel[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  originalShipDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serviceName?: string;
}