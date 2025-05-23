import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Role name cannot be empty.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, message: 'Each permission ID must be a valid UUID.' })
  permissionIds?: string[];
}