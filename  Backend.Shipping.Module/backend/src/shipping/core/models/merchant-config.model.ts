import { IsString, IsOptional, IsObject, IsEnum, MaxLength } from 'class-validator';
import { CarrierCode } from '../enums/carrier-code.enum';

export class MerchantConfigModel {
  @IsString()
  @MaxLength(50) // Assuming UUID or similar length
  merchantId: string;

  @IsEnum(CarrierCode)
  providerCode: CarrierCode;

  @IsString()
  @MaxLength(255) // Reference to a secret, e.g., ARN or key name
  credentialsRef: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @IsOptional()
  @IsObject()
  customProperties?: Record<string, any>;
}