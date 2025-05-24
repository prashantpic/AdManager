import { AppReviewProcessEntity } from '../review/entities/app-review-process.entity';

export interface IAppReviewProcessRepository {
  findById(id: string): Promise<AppReviewProcessEntity | null>;
  findBySubmissionId(submissionId: string): Promise<AppReviewProcessEntity | null>;
  save(reviewProcess: AppReviewProcessEntity): Promise<AppReviewProcessEntity>;
}