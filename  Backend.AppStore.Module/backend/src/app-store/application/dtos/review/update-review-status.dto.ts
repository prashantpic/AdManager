import { IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';

// Assuming ReviewFeedbackVO structure for DTO
export class ReviewFeedbackDto {
  @IsString()
  @IsOptional()
  overallComments?: string;

  // Example: criteriaFeedback: [{ criteriaName: 'Security', comments: 'Looks good', passed: true }]
  @IsOptional()
  criteriaFeedback?: any; // Define a more specific DTO for this if needed
}

export class UpdateReviewStatusDto {
  @IsEnum(AppReviewStatus)
  status: AppReviewStatus;

  @ValidateNested()
  @Type(() => ReviewFeedbackDto)
  @IsOptional()
  feedback?: ReviewFeedbackDto;

  @IsString()
  @IsOptional()
  reviewNotes?: string; // Internal notes for admins
}