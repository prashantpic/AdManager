import {
  IsString,
  Length,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdCreativeContentDto } from '../value-objects/ad-creative-content.dto'; // Or UpdateAdCreativeContentDto

export class UpdateAdDto {
  @IsString()
  @IsOptional()
  @Length(3, 255)
  name?: string;

  @IsUUID('4')
  @IsOptional()
  creativeId?: string | null;

  @ValidateNested()
  @Type(() => AdCreativeContentDto)
  @IsOptional()
  creativeContent?: AdCreativeContentDto | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productIds?: string[] | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  promotionIds?: string[] | null;

  @IsUrl()
  @IsOptional()
  @Length(10, 2048)
  landingPageUrl?: string | null;
}