import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { TargetingParametersDto } from '../value-objects/targeting-parameters.dto';

export class DefineAudienceDto {
  @IsString()
  @IsNotEmpty() // Name is required for creation
  @Length(3, 255)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000) // Allow empty description
  description?: string;

  @ValidateNested()
  @Type(() => TargetingParametersDto)
  @IsObject()
  @IsNotEmpty()
  targetingParameters: TargetingParametersDto;
}

// For updates, you might create a separate UpdateAudienceDto
// or make fields in DefineAudienceDto optional for PATCH scenarios.
// For simplicity, this DTO can be used for both create and PUT (full update).
// If PATCH is desired, a new DTO with all optional fields would be better.
export class UpdateAudienceDto {
    @IsString()
    @IsOptional()
    @Length(3, 255)
    name?: string;

    @IsString()
    @IsOptional()
    @Length(0, 1000)
    description?: string | null;

    @ValidateNested()
    @Type(() => TargetingParametersDto)
    @IsObject()
    @IsOptional()
    targetingParameters?: TargetingParametersDto;
}