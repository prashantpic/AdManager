import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';
import { ReviewFeedbackDto } from './update-review-status.dto';


export class AppReviewDto {
  id: string;
  submissionId: string;
  status: AppReviewStatus;
  assignedToUserId?: string; // Reviewer's user ID
  startedAt?: Date;
  completedAt?: Date;
  feedback?: ReviewFeedbackDto;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}