import { IsBoolean, IsString, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for gift options.
 */
export class GiftOptionsDto {
  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;
}