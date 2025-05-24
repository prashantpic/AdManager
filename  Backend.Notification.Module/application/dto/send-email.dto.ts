import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class SendEmailDto {
  @ValidateIf(o => typeof o.to === 'string')
  @IsEmail()
  @IsNotEmpty()
  to_string_version?: string; // Helper for conditional validation

  @ValidateIf(o => Array.isArray(o.to))
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  to_array_version?: string[]; // Helper for conditional validation

  // Actual 'to' field. Validation is handled by the above helpers and a custom validator or transform if needed.
  // For simplicity here, we'll assume the input will be one or the other, and the service layer will handle it.
  // A more robust solution might involve a custom validator on 'to' itself.
  @IsNotEmpty()
  to: string | string[];

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsOptional()
  @ValidateIf(o => typeof o.replyTo === 'string')
  @IsEmail()
  replyTo_string_version?: string; // Helper

  @IsOptional()
  @ValidateIf(o => Array.isArray(o.replyTo))
  @IsArray()
  @IsEmail({}, { each: true })
  replyTo_array_version?: string[]; // Helper

  @IsOptional()
  replyTo?: string | string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @IsOptional()
  @IsString()
  textBody?: string;

  @IsOptional()
  @IsString()
  htmlBody?: string;

  /**
   * Identifier for SES template
   */
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * Data for SES template
   */
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;
}