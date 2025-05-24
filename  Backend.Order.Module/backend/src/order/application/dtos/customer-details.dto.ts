import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

/**
 * Data Transfer Object for customer details.
 */
export class CustomerDetailsDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}