import {
  IsString,
  IsNotEmpty,
  Length,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdCreativeContentDto } from '../value-objects/ad-creative-content.dto';

export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsUUID('4')
  @IsNotEmpty() // adSetId is required if creating an ad not directly nested under ad set create
  adSetId: string;

  @IsUUID('4')
  @IsOptional() // Creative can be associated later or defined via content
  creativeId?: string;

  @ValidateNested()
  @Type(() => AdCreativeContentDto)
  @IsOptional() // Content can come from linked Creative or be ad-specific
  creativeContent?: AdCreativeContentDto;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  productIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  promotionIds?: string[];

  @IsUrl()
  @IsOptional()
  @Length(10, 2048)
  landingPageUrl?: string;
}