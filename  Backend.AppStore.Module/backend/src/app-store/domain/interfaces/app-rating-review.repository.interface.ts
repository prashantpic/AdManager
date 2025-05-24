import { AppRatingReviewEntity } from '../rating-review/entities/app-rating-review.entity';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';
import { PaginatedResult } from './app.repository.interface';


export interface IAppRatingReviewRepository {
  findById(id: string): Promise<AppRatingReviewEntity | null>;
  findByAppId(appId: string, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppRatingReviewEntity>>;
  findByAppAndMerchantId(
    appId: string,
    merchantId: string,
  ): Promise<AppRatingReviewEntity | null>;
  save(ratingReview: AppRatingReviewEntity): Promise<AppRatingReviewEntity>;
  delete(id: string): Promise<void>;
}