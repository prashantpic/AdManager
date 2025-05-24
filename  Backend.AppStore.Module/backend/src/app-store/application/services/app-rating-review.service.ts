import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IAppRatingReviewRepository,
  IAppInstallationRepository, // To verify merchant has installed the app
  AppRatingReviewEntity,
  ReviewContent,
} from '../../domain';
import { SubmitRatingReviewDto, AppRatingReviewDto, PaginationQueryDto } from '../dtos';
import { AppRatingReviewMapper } from '../mappers/app-rating-review.mapper';
import { AppOperationException } from '../../common/exceptions';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppRatingReviewService {
  private readonly enableAppStoreRatingModeration: boolean;

  constructor(
    @Inject('IAppRatingReviewRepository')
    private readonly appRatingReviewRepository: IAppRatingReviewRepository,
    @Inject('IAppInstallationRepository')
    private readonly appInstallationRepository: IAppInstallationRepository,
    private readonly appRatingReviewMapper: AppRatingReviewMapper,
    private readonly configService: ConfigService,
  ) {
    this.enableAppStoreRatingModeration = this.configService.get<boolean>('featureFlags.enableAppStoreRatingModeration') || false;
  }

  async submitReview(
    merchantId: string,
    dto: SubmitRatingReviewDto,
  ): Promise<AppRatingReviewDto> {
    // REQ-8-015
    const installation = await this.appInstallationRepository.findByAppAndMerchantId(dto.appId, merchantId);
    if (!installation || installation.status !== 'INSTALLED') { // Assuming 'INSTALLED' is the enum member
      throw new AppOperationException(
        `Merchant has not installed app with ID "${dto.appId}" or it's not in an active state.`,
      );
    }

    // Check if merchant already submitted a review for this app
    let reviewEntity = await this.appRatingReviewRepository.findByAppAndMerchantId(dto.appId, merchantId);

    if (reviewEntity) {
      // Update existing review
      reviewEntity.rating = dto.rating;
      reviewEntity.reviewContent = new ReviewContent(dto.rating, dto.reviewText);
      reviewEntity.submittedAt = new Date();
      // If moderation is enabled, and an admin edits it, this flow might be different.
      // For user re-submission, it might go back to pending if moderation is on.
      if (this.enableAppStoreRatingModeration) {
        reviewEntity.moderationStatus = 'PENDING';
        reviewEntity.moderatedAt = null;
        reviewEntity.moderatedByUserId = null;
      } else {
        reviewEntity.moderationStatus = 'APPROVED'; // Auto-approve if moderation is off
      }
    } else {
      // Create new review
      reviewEntity = new AppRatingReviewEntity();
      reviewEntity.appId = dto.appId;
      reviewEntity.merchantId = merchantId;
      reviewEntity.rating = dto.rating;
      reviewEntity.reviewContent = new ReviewContent(dto.rating, dto.reviewText);
      reviewEntity.submittedAt = new Date();
      reviewEntity.moderationStatus = this.enableAppStoreRatingModeration ? 'PENDING' : 'APPROVED';
    }

    const savedReview = await this.appRatingReviewRepository.save(reviewEntity);
    return this.appRatingReviewMapper.toDto(savedReview);
  }

  async getAppReviews(
    appId: string,
    pagination: PaginationQueryDto,
    filterStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' // For admin use
  ): Promise<{ reviews: AppRatingReviewDto[], total: number }> {
    // REQ-8-015
    // For merchants, only show 'APPROVED' reviews. For admin, allow filtering by status.
    const statusToFilter = filterStatus || 'APPROVED';
    const { reviews, totalCount } = await this.appRatingReviewRepository.findByAppIdWithPagination(appId, {
      ...pagination,
      status: statusToFilter,
    });
    return {
        reviews: reviews.map(review => this.appRatingReviewMapper.toDto(review)),
        total: totalCount,
    };
  }

  async moderateReview(
    reviewId: string,
    status: 'APPROVED' | 'REJECTED',
    adminUserId: string,
  ): Promise<AppRatingReviewDto> {
    // REQ-8-015 (Admin part)
    if (!this.enableAppStoreRatingModeration) {
        throw new AppOperationException('Rating moderation is disabled.');
    }

    const reviewEntity = await this.appRatingReviewRepository.findById(reviewId);
    if (!reviewEntity) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }

    reviewEntity.moderationStatus = status;
    reviewEntity.moderatedByUserId = adminUserId;
    reviewEntity.moderatedAt = new Date();

    const updatedReview = await this.appRatingReviewRepository.save(reviewEntity);
    return this.appRatingReviewMapper.toDto(updatedReview);
  }

  async getReviewByIdForAdmin(reviewId: string): Promise<AppRatingReviewDto | null> {
    const review = await this.appRatingReviewRepository.findById(reviewId);
    if (!review) {
        throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }
    return this.appRatingReviewMapper.toDto(review);
  }
}