import { IsUUID, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

// Assuming InstallationConfigVO structure for DTO
export class InstallationConfigDto {
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>; // Flexible JSON object
}

export class InstallAppDto {
  @IsUUID()
  @IsNotEmpty()
  appId: string;

  @IsOptional()
  @IsObject() // Or more specific validation if config structure is known
  configuration?: InstallationConfigDto; // Or Record<string, any>
}