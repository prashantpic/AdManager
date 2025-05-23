import {
  IsString,
  IsNotEmpty,
  Length,
  IsUUID,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetDetailsDto } from '../value-objects/budget-details.dto';
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto';
import { BidStrategyDto } from '../value-objects/bid-strategy.dto';
import { TargetingParametersDto } from '../value-objects/targeting-parameters.dto';
import { CreateAdDto } from '../ad/create-ad.dto';

export class CreateAdSetDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsUUID('4')
  @IsNotEmpty() // campaignId is required if creating an ad set not directly nested under campaign create
  campaignId: string;

  @IsUUID('4')
  @IsOptional()
  targetAudienceId?: string;

  @ValidateNested()
  @Type(() => TargetingParametersDto)
  @IsOptional()
  targetingParameters?: TargetingParametersDto; // Inline targeting

  @ValidateNested()
  @Type(() => BudgetDetailsDto)
  @IsOptional() // Budget can be inherited from campaign or set specifically
  budget?: BudgetDetailsDto;

  @ValidateNested()
  @Type(() => ScheduleDetailsDto)
  @IsOptional() // Schedule can be inherited or set specifically
  schedule?: ScheduleDetailsDto;

  @ValidateNested()
  @Type(() => BidStrategyDto)
  @IsOptional()
  bidStrategy?: BidStrategyDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdDto)
  @IsOptional()
  ads?: CreateAdDto[];
}