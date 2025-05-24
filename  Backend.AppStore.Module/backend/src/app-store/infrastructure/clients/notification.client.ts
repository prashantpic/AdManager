import { Injectable, HttpService } from '@nestjs/common'; // HttpService from @nestjs/axios
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppReviewStatus } from '../../common/enums';

interface SendNotificationPayload {
  userId: string; // Or developerId, merchantId
  templateId: string; // e.g., 'APP_REVIEW_STATUS_UPDATE', 'APP_COMPATIBILITY_ALERT'
  data: Record<string, any>; // Data for the template (appName, status, feedback, etc.)
  channels?: ('email' | 'sms' | 'inApp')[]; // Optional: specify channels
}

@Injectable()
export class NotificationClient {
  private notificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.notificationServiceUrl = this.configService.get<string>('services.notification.url');
  }

  private async sendNotification(payload: SendNotificationPayload): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/send`, payload)
      );
    } catch (error) {
      // console.error(`Error sending notification via NotificationClient:`, error.response?.data || error.message, payload);
      // Decide if this should throw or just log, as notifications might be non-critical path
      throw new Error(`NotificationClient: Failed to send notification - ${error.response?.data?.message || error.message}`);
    }
  }

  async sendAppReviewStatusNotification(
    developerId: string,
    appName: string,
    status: AppReviewStatus,
    feedback: string,
  ): Promise<void> {
    // REQ-8-004
    const payload: SendNotificationPayload = {
      userId: developerId,
      templateId: 'APP_REVIEW_STATUS_UPDATE_V1', // Example template ID
      data: {
        appName,
        status: AppReviewStatus[status], // Get string representation of enum
        feedback: feedback || 'No specific feedback provided.',
        // deepLinkToApp: `https://developer.platform.com/apps/${appId}` // Conceptual
      },
      channels: ['email'] // Default to email
    };
    await this.sendNotification(payload);
  }

  async sendAppCompatibilityAlert(
    developerId: string,
    appName: string,
    versionNumber: string,
    details: string, // Compatibility issues
  ): Promise<void> {
    // REQ-8-006
    const payload: SendNotificationPayload = {
      userId: developerId,
      templateId: 'APP_COMPATIBILITY_ALERT_V1', // Example template ID
      data: {
        appName,
        versionNumber,
        compatibilityDetails: details,
        // deepLinkToAppVersion: `https://developer.platform.com/apps/${appId}/versions/${versionId}` // Conceptual
      },
      channels: ['email']
    };
    await this.sendNotification(payload);
  }
  
  async sendNewAppSubmissionNotification(adminGroupId: string, submissionId: string, appName: string): Promise<void> {
    const payload: SendNotificationPayload = {
        userId: adminGroupId, // Could be a group ID or routed to multiple admins
        templateId: 'ADMIN_NEW_APP_SUBMISSION_V1',
        data: {
            appName,
            submissionId,
            // deepLinkToReviewQueue: `https.admin.platform.com/appstore/reviews/${submissionId}` // Conceptual
        },
        channels: ['email'] // Or other admin notification channels
    };
    await this.sendNotification(payload);
  }
}