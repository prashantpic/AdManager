import {
  IsString,
  Length,
  IsEnum,
  IsUUID,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignObjective } from '../../../constants/campaign-objective.enum';
import { CampaignStatus } from '../../../constants/campaign-status.enum';
import { BudgetDetailsDto } from '../value-objects/budget-details.dto'; // Assuming a similar DTO for updates
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto'; // Assuming a similar DTO for updates

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  @Length(3, 255)
  name?: string;

  @IsEnum(CampaignObjective)
  @IsOptional()
  objective?: CampaignObjective;

  @ValidateNested()
  @Type(() => BudgetDetailsDto) // Or an UpdateBudgetDto if fields differ
  @IsOptional()
  budget?: BudgetDetailsDto;

  @ValidateNested()
  @Type(() => ScheduleDetailsDto) // Or an UpdateScheduleDto
  @IsOptional()
  schedule?: ScheduleDetailsDto;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus; // Note: Status changes often have dedicated endpoints/services

  @IsUUID('4')
  @IsOptional()
  audienceId?: string | null; // Allow null to unset audience
}