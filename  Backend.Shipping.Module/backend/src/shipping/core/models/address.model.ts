import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class AddressModel {
  @IsString()
  @MaxLength(100)
  street1: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  street2?: string;

  @IsString()
  @MaxLength(50)
  city: string;

  @IsString()
  @MaxLength(50)
  stateProvince: string; // Use state code or full name

  @IsString()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @MaxLength(2) // ISO 3166-1 alpha-2 country code
  countryCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isResidential?: boolean;
}