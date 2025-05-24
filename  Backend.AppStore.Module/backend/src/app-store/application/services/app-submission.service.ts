import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  IAppRepository,
  IAppVersionRepository,
  IAppSubmissionRepository,
  IAppReviewProcessRepository,
  AppCompatibilityService, // Domain Service
  AppEntity,
  AppVersionEntity,
  AppSubmissionEntity,
  AppReviewProcessEntity,
  SubmissionDetails,
} from '../../domain';
import { NotificationClient, PlatformApiVersionClient } from '../../infrastructure/clients'; // Assuming these are correctly pathed
import { SubmitAppDto, AppSubmissionDto } from '../dtos';
import { AppSubmissionMapper } from '../mappers/app-submission.mapper';
import { AppReviewStatus, AppStatus } from '../../common/enums';
import { AppNotFoundException, AppSubmissionInvalidException } from '../../common/exceptions';

@Injectable()
export class AppSubmissionService {
  constructor(
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppVersionRepository')
    private readonly appVersionRepository: IAppVersionRepository,
    @Inject('IAppSubmissionRepository')
    private readonly appSubmissionRepository: IAppSubmissionRepository,
    @Inject('IAppReviewProcessRepository')
    private readonly appReviewProcessRepository: IAppReviewProcessRepository,
    private readonly appCompatibilityService: AppCompatibilityService, // Domain service
    private readonly notificationClient: NotificationClient, // Infrastructure client
    private readonly appSubmissionMapper: AppSubmissionMapper,
  ) {}

  async submitApp(developerId: string, dto: SubmitAppDto): Promise<AppSubmissionDto> {
    // REQ-8-003, REQ-8-005
    let appEntity: AppEntity | null = null;

    if (dto.appId) {
      appEntity = await this.appRepository.findByIdAndDeveloperId(dto.appId, developerId);
      if (!appEntity) {
        throw new AppNotFoundException(`App with ID "${dto.appId}" not found or not owned by developer.`);
      }
      // Prevent submitting new versions for apps in certain states (e.g., REJECTED and not draft)
      if (appEntity.status === AppStatus.REJECTED /* more complex logic might be needed */) {
          throw new AppSubmissionInvalidException(`Cannot submit new version for an app with status: ${appEntity.status}`);
      }
    } else {
      // New app submission
      appEntity = new AppEntity();
      appEntity.name = dto.name;
      appEntity.description = dto.description;
      appEntity.developerId = developerId;
      appEntity.developerInfo = dto.developerInfo; // Assuming DTO has this VO
      appEntity.pricingModel = dto.pricingModel;
      appEntity.pricingDetails = dto.pricingDetails; // Assuming DTO has this VO
      // appEntity.categories = await this.categoryRepository.findByIds(dto.categoryIds);
      // appEntity.requiredPermissions = await this.permissionRepository.findByIds(dto.requiredPermissionIds);
      appEntity.status = AppStatus.DRAFT; // Initial status for a new app
      appEntity = await this.appRepository.save(appEntity);
    }

    // Create AppVersion
    const appVersionEntity = new AppVersionEntity();
    appVersionEntity.appId = appEntity.id;
    appVersionEntity.app = appEntity;
    appVersionEntity.versionNumber = dto.versionNumber;
    appVersionEntity.changelog = dto.changelog;
    appVersionEntity.packageUrl = dto.packageUrl;
    appVersionEntity.platformApiVersionCompatibility = dto.platformApiVersionCompatibility; // Array of compatible API versions
    appVersionEntity.submissionDate = new Date();
    appVersionEntity.reviewStatus = AppReviewStatus.PENDING_REVIEW; // Default for new version submission
    appVersionEntity.isActive = false; // Not active until approved
    const savedVersion = await this.appVersionRepository.save(appVersionEntity);

    // Create AppSubmission
    const submissionDetails = new SubmissionDetails(
      dto.versionNumber,
      dto.packageUrl,
      dto.changelog,
      dto.submissionNotes,
    );

    const appSubmissionEntity = new AppSubmissionEntity();
    appSubmissionEntity.appId = appEntity.id;
    appSubmissionEntity.app = appEntity;
    appSubmissionEntity.appVersionId = savedVersion.id; // Link to the specific version being submitted
    appSubmissionEntity.appVersion = savedVersion;
    appSubmissionEntity.developerId = developerId;
    appSubmissionEntity.submissionDetails = submissionDetails;
    appSubmissionEntity.status = AppReviewStatus.PENDING_REVIEW;
    appSubmissionEntity.submittedAt = new Date();
    const savedSubmission = await this.appSubmissionRepository.save(appSubmissionEntity);

    // Create AppReviewProcess
    const appReviewProcessEntity = new AppReviewProcessEntity();
    appReviewProcessEntity.submissionId = savedSubmission.id;
    appReviewProcessEntity.submission = savedSubmission;
    appReviewProcessEntity.status = AppReviewStatus.PENDING_REVIEW;
    await this.appReviewProcessRepository.save(appReviewProcessEntity);
    
    savedSubmission.reviewProcess = appReviewProcessEntity; // Link it back for the DTO

    // Update App status if it was DRAFT
    if (appEntity.status === AppStatus.DRAFT) {
        appEntity.status = AppStatus.PENDING_REVIEW;
        await this.appRepository.save(appEntity);
    }

    // Trigger initial compatibility check (could be async)
    try {
      const compatibilityResult = await this.appCompatibilityService.checkCompatibility(savedVersion);
      if (!compatibilityResult.isCompatible) {
        // Notify developer immediately about compatibility issues
        await this.notificationClient.sendAppCompatibilityAlert(
          developerId,
          appEntity.name,
          savedVersion.versionNumber,
          compatibilityResult.issues.join(', '),
        );
        // Note: The review process still starts, but this gives early feedback.
      }
    } catch (error) {
      console.error('Error during initial compatibility check:', error);
      // Log error, but don't fail submission for this
    }
    
    // Notify admin/review team (conceptual)
    // this.notificationClient.sendNewAppSubmissionNotification(savedSubmission.id);


    return this.appSubmissionMapper.toDto(savedSubmission);
  }
}