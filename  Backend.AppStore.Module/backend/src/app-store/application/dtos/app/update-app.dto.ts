import {
  IsString,
  IsUrl,
  IsEnum,
  ValidateNested,
  IsArray,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';
import { AppStatus } from '../../../common/enums/app-status.enum';
import { AppPricingDto, DeveloperInfoDto } from './create-app.dto';


export class UpdateAppDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AppStatus)
  @IsOptional()
  status?: AppStatus; // Admins might change this, or developers for draft/archived

  @IsEnum(AppPricingModel)
  @IsOptional()
  pricingModel?: AppPricingModel;

  @ValidateNested()
  @Type(() => AppPricingDto)
  @IsOptional()
  pricingDetails?: AppPricingDto;

  @ValidateNested()
  @Type(() => DeveloperInfoDto)
  @IsOptional()
  developerInfo?: DeveloperInfoDto;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  requiredPermissionIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];
}