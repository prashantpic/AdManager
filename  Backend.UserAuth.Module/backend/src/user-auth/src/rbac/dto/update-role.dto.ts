import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, message: 'Each permission ID must be a valid UUID.' })
  permissionIds?: string[]; // Allows full replacement of permissions
}