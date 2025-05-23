import {
  IsString,
  IsNotEmpty,
  Length,
  IsEnum,
  IsUUID,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignObjective } from '../../../constants/campaign-objective.enum';
import { BudgetDetailsDto } from '../value-objects/budget-details.dto';
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto';
import { CreateAdSetDto } from '../ad-set/create-ad-set.dto';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsEnum(CampaignObjective)
  @IsNotEmpty()
  objective: CampaignObjective;

  @ValidateNested()
  @Type(() => BudgetDetailsDto)
  @IsNotEmpty()
  budget: BudgetDetailsDto;

  @ValidateNested()
  @Type(() => ScheduleDetailsDto)
  @IsNotEmpty()
  schedule: ScheduleDetailsDto;

  @IsUUID('4')
  @IsOptional()
  audienceId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdSetDto)
  @IsOptional()
  // @ArrayMinSize(1) // A campaign usually needs at least one ad set to be useful, but can be added later
  adSets?: CreateAdSetDto[];
}