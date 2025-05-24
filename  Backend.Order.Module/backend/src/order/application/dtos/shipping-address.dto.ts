import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for shipping addresses.
 */
export class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;
}