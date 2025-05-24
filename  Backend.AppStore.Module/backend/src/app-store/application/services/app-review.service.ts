import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  IAppSubmissionRepository,
  IAppReviewProcessRepository,
  IAppRepository,
  IAppVersionRepository,
  AppSubmissionEntity,
  AppReviewProcessEntity,
  AppEntity,
  AppVersionEntity,
  AppCompatibilityService,
} from '../../domain';
import { NotificationClient } from '../../infrastructure/clients';
import { UpdateReviewStatusDto, AppReviewDto, AppSubmissionDto } from '../dtos';
import { AppReviewStatus, AppStatus } from '../../common/enums';
import { AppSubmissionMapper } from '../mappers/app-submission.mapper'; // For returning AppSubmissionDto
import { AppReviewMapper } from '../mappers/app-review.mapper'; // For returning AppReviewDto
import { AppOperationException } from '../../common/exceptions';
import { ConfigService } from '@nestjs/config'; // For feature flags

@Injectable()
export class AppReviewService {
  private readonly enableAppReviewAutoApprovalBypass: boolean;

  constructor(
    @Inject('IAppSubmissionRepository')
    private readonly appSubmissionRepository: IAppSubmissionRepository,
    @Inject('IAppReviewProcessRepository')
    private readonly appReviewProcessRepository: IAppReviewProcessRepository,
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppVersionRepository')
    private readonly appVersionRepository: IAppVersionRepository,
    private readonly appCompatibilityService: AppCompatibilityService,
    private readonly notificationClient: NotificationClient,
    private readonly appSubmissionMapper: AppSubmissionMapper,
    private readonly appReviewMapper: AppReviewMapper,
    private readonly configService: ConfigService, // For feature flags
  ) {
    this.enableAppReviewAutoApprovalBypass = this.configService.get<boolean>('featureFlags.enableAppReviewAutoApprovalBypass') || false;
  }

  async getPendingSubmissions(pagination: { page: number, limit: number }): Promise<AppSubmissionDto[]> {
    // REQ-8-004
    const submissions = await this.appSubmissionRepository.findPendingReview(pagination);
    return submissions.map(sub => this.appSubmissionMapper.toDto(sub));
  }

  async getSubmissionDetailsForReview(submissionId: string): Promise<AppSubmissionDto | null> {
    // REQ-8-004
    const submission = await this.appSubmissionRepository.findByIdWithRelations(submissionId); // Assumes method to fetch with app, version, review process
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${submissionId}" not found.`);
    }
    return this.appSubmissionMapper.toDto(submission);
  }

  async updateReviewStatus(
    reviewId: string, // This should be reviewProcessId
    dto: UpdateReviewStatusDto,
    adminUserId: string,
  ): Promise<AppReviewDto> {
    // REQ-8-004
    const reviewProcess = await this.appReviewProcessRepository.findByIdWithSubmission(reviewId);
    if (!reviewProcess || !reviewProcess.submission) {
      throw new NotFoundException(`Review process with ID "${reviewId}" or its submission not found.`);
    }

    const submission = reviewProcess.submission;
    const app = await this.appRepository.findById(submission.appId);
    const appVersion = await this.appVersionRepository.findById(submission.appVersionId);

    if (!app || !appVersion) {
      throw new NotFoundException('Associated App or AppVersion not found for the submission.');
    }

    if (![AppReviewStatus.PENDING_REVIEW, AppReviewStatus.IN_REVIEW, AppReviewStatus.CHANGES_REQUESTED].includes(reviewProcess.status)) {
        throw new AppOperationException(`Review status cannot be updated from ${reviewProcess.status}.`);
    }
    
    reviewProcess.status = dto.status;
    reviewProcess.feedback = dto.feedback; // Assuming ReviewFeedback VO structure
    reviewProcess.reviewNotes = dto.reviewNotes;
    reviewProcess.assignedToUserId = adminUserId; // The admin performing the update
    reviewProcess.completedAt = (dto.status === AppReviewStatus.APPROVED || dto.status === AppReviewStatus.REJECTED_WITH_FEEDBACK) ? new Date() : null;
    reviewProcess.startedAt = reviewProcess.startedAt || new Date();

    submission.status = dto.status; // Sync submission status
    appVersion.reviewStatus = dto.status; // Sync version review status

    await this.appSubmissionRepository.save(submission);
    await this.appVersionRepository.save(appVersion);
    const updatedReviewProcess = await this.appReviewProcessRepository.save(reviewProcess);

    if (dto.status === AppReviewStatus.APPROVED) {
      await this.approveSubmissionInternal(submission, app, appVersion, adminUserId);
    } else if (dto.status === AppReviewStatus.REJECTED_WITH_FEEDBACK) {
      await this.rejectSubmissionInternal(submission, app, appVersion, adminUserId, dto.feedback?.overallComments || 'N/A');
    }
    // For CHANGES_REQUESTED, only notification might be needed.

    await this.notificationClient.sendAppReviewStatusNotification(
      submission.developerId,
      app.name,
      dto.status,
      dto.feedback?.overallComments || '',
    );

    return this.appReviewMapper.toDto(updatedReviewProcess);
  }


  private async approveSubmissionInternal(
    submission: AppSubmissionEntity,
    app: AppEntity,
    appVersion: AppVersionEntity,
    adminUserId: string,
  ): Promise<void> {
    
    // Compatibility Check before final approval
    const compatibilityResult = await this.appCompatibilityService.checkCompatibility(appVersion);
    if (!compatibilityResult.isCompatible && !this.enableAppReviewAutoApprovalBypass) { // Allow bypass via feature flag
        // If not compatible, move to a 'changes_requested' or similar state, or auto-reject
        submission.status = AppReviewStatus.CHANGES_REQUESTED;
        appVersion.reviewStatus = AppReviewStatus.CHANGES_REQUESTED;
        // Update review process as well
        const reviewProcess = await this.appReviewProcessRepository.findBySubmissionId(submission.id);
        if(reviewProcess) {
            reviewProcess.status = AppReviewStatus.CHANGES_REQUESTED;
            reviewProcess.feedback = { overallComments: `App version ${appVersion.versionNumber} is not compatible with current platform APIs. Issues: ${compatibilityResult.issues.join(', ')}`, criteriaFeedback: [] };
            await this.appReviewProcessRepository.save(reviewProcess);
        }
        
        await this.appSubmissionRepository.save(submission);
        await this.appVersionRepository.save(appVersion);

        await this.notificationClient.sendAppCompatibilityAlert(
          submission.developerId,
          app.name,
          appVersion.versionNumber,
          `Review approved, but compatibility issues found: ${compatibilityResult.issues.join(', ')}. Please address before publishing.`
        );
        throw new AppOperationException(`App version ${appVersion.versionNumber} is not compatible. Approval halted.`);
    }

    appVersion.isActive = true; // Activate the version
    appVersion.releaseDate = new Date();
    
    // If this is the first approved version, or if chosen, set app to PUBLISHED
    // Logic to determine if app should be auto-published or remain in an 'Approved/Ready to Publish' state
    if (app.status !== AppStatus.PUBLISHED) { // Or based on some other logic
        app.status = AppStatus.PUBLISHED; // Or e.g. APPROVED_READY_TO_PUBLISH
    }
    app.latestVersionId = appVersion.id; // Update latest active version on the app

    await this.appVersionRepository.save(appVersion);
    await this.appRepository.save(app);
    
    // Additional logic: Deactivate previous active versions if any
    await this.appVersionRepository.deactivateOtherVersions(app.id, appVersion.id);

    // Notify developer of approval
    // Notification is handled by the calling method
  }

  private async rejectSubmissionInternal(
    submission: AppSubmissionEntity,
    app: AppEntity,
    appVersion: AppVersionEntity,
    adminUserId: string,
    feedbackText: string,
  ): Promise<void> {
    appVersion.isActive = false;
    // App status might revert to DRAFT or remain PENDING_REVIEW depending on rules
    // For simplicity, if a submission tied to a new app is rejected, the app might go to REJECTED.
    // If it's a new version of an existing published app, the app status remains PUBLISHED.
    if (app.status === AppStatus.PENDING_REVIEW && !(await this.appVersionRepository.hasOtherApprovedVersions(app.id))) {
        app.status = AppStatus.REJECTED; // Or DRAFT
        await this.appRepository.save(app);
    }
    // Notification is handled by the calling method
  }
}