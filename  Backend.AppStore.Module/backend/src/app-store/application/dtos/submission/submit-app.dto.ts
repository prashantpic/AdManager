import {
  IsString,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAppDto } from '../app/create-app.dto'; // For new app details
import { CreateAppVersionDto } from '../app-version/create-app-version.dto';


// This DTO can be complex as it might create a new app or just a new version.
// For simplicity, let's assume specific fields for submission.

export class SubmissionAppDetailsDto extends CreateAppDto {}
export class SubmissionVersionDetailsDto extends CreateAppVersionDto {}

export class SubmitAppDto {
  @IsUUID()
  @IsOptional() // If null, implies a new app submission
  appId?: string;

  // Details for a new app (only if appId is null)
  @ValidateNested()
  @Type(() => SubmissionAppDetailsDto)
  @IsOptional()
  appDetails?: SubmissionAppDetailsDto;

  // Details for the new version being submitted
  @ValidateNested()
  @Type(() => SubmissionVersionDetailsDto)
  @IsNotEmpty()
  versionDetails: SubmissionVersionDetailsDto;

  @IsString()
  @IsOptional()
  submissionNotes?: string; // Notes from developer for the reviewer
}