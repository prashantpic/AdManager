import { Injectable } from '@nestjs/common';
import { AppSubmissionEntity, AppReviewProcessEntity } from '../../domain';
import { AppSubmissionDto, AppReviewDto } from '../dtos';
import { AppReviewMapper } from './app-review.mapper'; // Assuming AppReviewMapper exists
import { AppVersionMapper } from './app-version.mapper'; // Assuming AppVersionMapper exists

@Injectable()
export class AppSubmissionMapper {
  constructor(
    private readonly appReviewMapper: AppReviewMapper,
    private readonly appVersionMapper: AppVersionMapper,
    ) {}

  public toDto(entity: AppSubmissionEntity): AppSubmissionDto {
    if (!entity) return null;

    let reviewProcessDto: AppReviewDto | null = null;
    if (entity.reviewProcess) {
      reviewProcessDto = this.appReviewMapper.toDto(entity.reviewProcess);
    }
    
    let appVersionDto = null;
    if(entity.appVersion) {
        appVersionDto = this.appVersionMapper.toDto(entity.appVersion);
    }


    return {
      id: entity.id,
      appId: entity.appId,
      appVersionId: entity.appVersionId,
      developerId: entity.developerId,
      submissionDetails: entity.submissionDetails, // Value Object
      status: entity.status,
      submittedAt: entity.submittedAt,
      reviewProcess: reviewProcessDto,
      appVersion: appVersionDto,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  // toEntity method might not be needed if DTOs are directly used to create/update entities in services
}