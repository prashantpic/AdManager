import { Injectable } from '@nestjs/common';
import { AppRatingReviewEntity } from '../../domain';
import { AppRatingReviewDto } from '../dtos';

@Injectable()
export class AppRatingReviewMapper {
  public toDto(entity: AppRatingReviewEntity): AppRatingReviewDto {
    if (!entity) return null;
    return {
      id: entity.id,
      appId: entity.appId,
      merchantId: entity.merchantId,
      rating: entity.rating,
      reviewText: entity.reviewContent?.text, // Access from VO
      submittedAt: entity.submittedAt,
      moderationStatus: entity.moderationStatus,
      moderatedByUserId: entity.moderatedByUserId,
      moderatedAt: entity.moderatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  // toEntity might not be directly needed if service handles entity creation/update
}