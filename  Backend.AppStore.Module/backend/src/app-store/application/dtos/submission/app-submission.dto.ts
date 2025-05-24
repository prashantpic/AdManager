import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';
import { AppReviewDto } from '../review/app-review.dto';
import { AppVersionDto } from '../app-version/app-version.dto'; // Or a simpler version DTO

// Assuming SubmissionDetailsVO structure for DTO
export class SubmissionDetailsDto {
  versionNumber: string;
  packageUrl: string;
  changelog: string;
  submissionNotes?: string;
}

export class AppSubmissionDto {
  id: string;
  appId?: string; // Can be null if it's a submission for a new app not yet created
  appName?: string; // Helpful to display
  developerId: string;
  submissionDetails: SubmissionDetailsDto; // Could also be SubmissionVersionDetailsDto
  status: AppReviewStatus;
  submittedAt: Date;
  reviewProcess?: AppReviewDto; // Or just reviewProcessId
  // submittedVersion?: AppVersionDto; // The version that was submitted
  createdAt: Date;
  updatedAt: Date;
}