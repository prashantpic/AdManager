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
  @ValidateIf(o => Array.isArray(o.to))
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  // Property 'to' is defined below

  @ValidateIf(o => typeof o.to === 'string')
  @IsEmail()
  @IsNotEmpty()
  to: string | string[];

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsOptional()
  @ValidateIf(o => Array.isArray(o.replyTo))
  @IsArray()
  // Note: ArrayNotEmpty is not specified for replyTo in its decorators ["IsOptional()","IsArray() || IsEmail()"]
  // So, an empty array would be permissible if 'replyTo' is an array.
  @IsEmail({}, { each: true })
  // Property 'replyTo' is defined below

  @IsOptional()
  @ValidateIf(o => typeof o.replyTo === 'string' && o.replyTo !== undefined)
  @IsEmail()
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

  @IsOptional()
  @IsString()
  templateId?: string; // Identifier for SES template

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>; // Data for SES template
}