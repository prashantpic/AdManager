import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppRatingReviewEntity, IAppRatingReviewRepository } from '../../domain';
import { PaginationQueryDto } from '../../application/dtos';

@Injectable()
export class TypeOrmAppRatingReviewRepository implements IAppRatingReviewRepository {
  constructor(
    @InjectRepository(AppRatingReviewEntity)
    private readonly ratingReviewOrmRepository: Repository<AppRatingReviewEntity>,
  ) {}

  async findById(id: string): Promise<AppRatingReviewEntity | null> {
    return this.ratingReviewOrmRepository.findOne({ where: { id }, relations: ['app'] });
  }

  async findByAppId(appId: string, filter?: { status?: string }): Promise<AppRatingReviewEntity[]> {
    const whereClause: any = { appId };
    if (filter?.status) {
        whereClause.moderationStatus = filter.status;
    }
    return this.ratingReviewOrmRepository.find({ where: whereClause, relations: ['app'], order: { submittedAt: 'DESC' } });
  }

  async findByAppIdWithPagination(
    appId: string,
    params: PaginationQueryDto & { status?: string }
  ): Promise<{ reviews: AppRatingReviewEntity[], totalCount: number }> {
    const { page = 1, limit = 10, status } = params;
    const whereClause: any = { appId };
    if (status) {
        whereClause.moderationStatus = status;
    }

    const [reviews, totalCount] = await this.ratingReviewOrmRepository.findAndCount({
        where: whereClause,
        relations: ['app'], // Consider if app relation is needed for listing
        order: { submittedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
    });
    return { reviews, totalCount };
  }

  async findByAppAndMerchantId(appId: string, merchantId: string): Promise<AppRatingReviewEntity | null> {
    return this.ratingReviewOrmRepository.findOne({ where: { appId, merchantId }, relations: ['app'] });
  }
  
  async getAverageRating(appId: string): Promise<number | null> {
    const result = await this.ratingReviewOrmRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalRatings')
      .where('review.appId = :appId', { appId })
      .andWhere('review.moderationStatus = :status', { status: 'APPROVED' }) // Only approved reviews
      .getRawOne();

    return result && result.avgRating !== null ? parseFloat(parseFloat(result.avgRating).toFixed(1)) : 0;
  }
  
  async getTotalRatings(appId: string): Promise<number> {
     const count = await this.ratingReviewOrmRepository.count({
         where: { appId, moderationStatus: 'APPROVED'}
     });
     return count;
  }


  async save(ratingReview: AppRatingReviewEntity): Promise<AppRatingReviewEntity> {
    return this.ratingReviewOrmRepository.save(ratingReview);
  }

  async delete(id: string): Promise<void> {
    await this.ratingReviewOrmRepository.delete(id);
  }
}