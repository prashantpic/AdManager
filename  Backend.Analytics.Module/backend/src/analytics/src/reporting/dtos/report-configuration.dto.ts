import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportRequestDto } from './report-request.dto';

/**
 * DTO representing a saved report configuration, including its name,
 * description, and the underlying report request details.
 */
export class ReportConfigurationDto {
  /**
   * Unique identifier of the saved configuration (present when retrieved).
   */
  @IsString()
  @IsOptional()
  id?: string;

  /**
   * Identifier of the merchant who owns this configuration.
   * This is typically set by the backend based on the authenticated user
   * and not expected in the request body for creation.
   */
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  /**
   * User-defined name for the saved report configuration.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /**
   * Optional description for the configuration.
   */
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  /**
   * The actual report request parameters being saved.
   */
  @ValidateNested()
  @Type(() => ReportRequestDto)
  @IsNotEmpty()
  configurationDetails: ReportRequestDto;
}