import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';

export class AppVersionDto {
  id: string;
  appId: string;
  versionNumber: string;
  changelog: string;
  packageUrl: string;
  platformApiVersionCompatibility: string[];
  submissionDate: Date; // This might be on AppSubmissionEntity instead
  reviewStatus: AppReviewStatus; // This might be on AppSubmissionEntity
  isActive: boolean; // Is this the currently published/active version for the app
  releaseDate?: Date; // When it was approved/published
  createdAt: Date;
  updatedAt: Date;
}