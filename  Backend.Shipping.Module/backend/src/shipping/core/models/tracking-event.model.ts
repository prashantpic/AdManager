import { IsDate, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressModel } from './address.model';

export class TrackingEventModel {
  @IsDate()
  timestamp: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressModel)
  location?: AddressModel; // Location where the event occurred

  @IsString()
  status: string; // Short status code or description (e.g., "IN_TRANSIT", "DELIVERED")

  @IsString()
  description: string; // Detailed description of the event

  @IsOptional()
  @IsString()
  signatureRecipient?: string; // If delivered and signed
}