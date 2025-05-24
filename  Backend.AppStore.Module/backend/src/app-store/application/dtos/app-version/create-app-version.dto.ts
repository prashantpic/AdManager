import { IsString, IsNotEmpty, IsUrl, IsOptional, IsArray } from 'class-validator';

export class CreateAppVersionDto {
  @IsString()
  @IsNotEmpty()
  versionNumber: string; // e.g., "1.0.0"

  @IsString()
  @IsNotEmpty()
  changelog: string;

  @IsUrl()
  @IsNotEmpty()
  packageUrl: string; // URL to the app package (e.g., S3 link)

  @IsArray()
  @IsString({ each: true })
  @IsOptional() // Could default to ['latest'] or a specific version
  platformApiVersionCompatibility?: string[]; // e.g., ["v1", "v1.1"]
}