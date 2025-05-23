import {
  IsString,
  Length,
  IsUUID,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetDetailsDto } from '../value-objects/budget-details.dto'; // Or UpdateBudgetDto
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto'; // Or UpdateScheduleDto
import { BidStrategyDto } from '../value-objects/bid-strategy.dto'; // Or UpdateBidStrategyDto
import { TargetingParametersDto } from '../value-objects/targeting-parameters.dto'; // Or UpdateTargetingDto


export class UpdateAdSetDto {
  @IsString()
  @IsOptional()
  @Length(3, 255)
  name?: string;

  @IsUUID('4')
  @IsOptional()
  targetAudienceId?: string | null;

  @ValidateNested()
  @Type(() => TargetingParametersDto)
  @IsOptional()
  targetingParameters?: TargetingParametersDto | null;

  @ValidateNested()
  @Type(() => BudgetDetailsDto)
  @IsOptional()
  budget?: BudgetDetailsDto | null;

  @ValidateNested()
  @Type(() => ScheduleDetailsDto)
  @IsOptional()
  schedule?: ScheduleDetailsDto | null;

  @ValidateNested()
  @Type(() => BidStrategyDto)
  @IsOptional()
  bidStrategy?: BidStrategyDto | null;
}