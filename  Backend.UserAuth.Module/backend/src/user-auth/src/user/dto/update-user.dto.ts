import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  // Add other updatable fields as needed, e.g.:
  // @IsOptional()
  // @IsBoolean()
  // isActive?: boolean; // If admin can update this
}