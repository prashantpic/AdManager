import { AppSubmissionEntity } from '../submission/entities/app-submission.entity';
import { AppReviewStatus } from '../../common/enums/app-review-status.enum';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';
import { PaginatedResult } from './app.repository.interface';


export interface IAppSubmissionRepository {
  findById(id: string): Promise<AppSubmissionEntity | null>;
  findByDeveloperId(developerId: string, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppSubmissionEntity>>;
  findByStatus(status: AppReviewStatus, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppSubmissionEntity>>;
  findAll(pagination?: PaginationQueryDto): Promise<PaginatedResult<AppSubmissionEntity>>;
  save(submission: AppSubmissionEntity): Promise<AppSubmissionEntity>;
}