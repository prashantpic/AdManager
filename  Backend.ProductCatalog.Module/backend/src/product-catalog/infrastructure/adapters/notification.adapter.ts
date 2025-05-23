import { Injectable, Logger } from '@nestjs/common';
import { AdManager } from '../../../../domain/common/enums/ad-platform.enum';
// Assume NotificationService is provided by a Backend.Notification.Module
// import { NotificationService, NotificationPayload } from '@admanager/backend-notification';

// Placeholder for Core Notification Service
interface NotificationService {
  sendEmail(params: { to: string, subject: string, templateId?: string, context?: Record<string, any>, body?: string }): Promise<void>;
  // sendSms, sendPushNotification, etc.
}

// Placeholder for merchant user retrieval to get email, etc.
interface MerchantUserService {
    getMerchantUserContactDetails(merchantId: string): Promise<{ email?: string; phone?: string }>;
}

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Adapters {
  /**
   * Adapter for notification services specific to product catalog events.
   * Handles sending notifications to merchants regarding sync issues or successes.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class ProductCatalogNotificationAdapter {
    private readonly logger = new Logger(ProductCatalogNotificationAdapter.name);

    constructor(
      // @Inject('NotificationService') // Assuming registered in a core NotificationModule
      private readonly notificationService: NotificationService, // Placeholder
      // @Inject('MerchantUserService') // To fetch merchant contact details
      private readonly merchantUserService: MerchantUserService, // Placeholder
    ) {}

    async sendSyncFailureNotification(
      merchantId: string,
      catalogName: string,
      adPlatform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform,
      errorMessage: string,
      errorCode?: string,
    ): Promise<void> {
      this.logger.log(`Preparing sync failure notification for merchant ${merchantId}, catalog ${catalogName}`);
      try {
        const contactDetails = await this.merchantUserService.getMerchantUserContactDetails(merchantId);
        if (!contactDetails?.email) {
            this.logger.warn(`No email contact found for merchant ${merchantId}. Cannot send sync failure notification.`);
            return;
        }

        const subject = `Product Catalog Sync Failed: ${catalogName} with ${adPlatform}`;
        const body = `
          <p>Dear Merchant,</p>
          <p>The synchronization of your product catalog '<strong>${catalogName}</strong>' with <strong>${adPlatform.toUpperCase()}</strong> has failed.</p>
          <p><strong>Error Details:</strong></p>
          <p>${errorMessage}</p>
          ${errorCode ? `<p><strong>Error Code:</strong> ${errorCode}</p>` : ''}
          <p>Please review your catalog settings and product data. If the issue persists, contact support.</p>
          <p>Thank you,<br/>The AdManager Platform Team</p>
        `;
        // Example using a template ID if your NotificationService supports it
        // const templateId = 'productCatalogSyncFailure';
        // const context = { catalogName, adPlatform, errorMessage, errorCode };

        await this.notificationService.sendEmail({
            to: contactDetails.email,
            subject,
            body, // or templateId and context
        });
        this.logger.log(`Sync failure notification sent to merchant ${merchantId} for catalog ${catalogName}`);
      } catch (error) {
        this.logger.error(
          `Failed to send sync failure notification for merchant ${merchantId}, catalog ${catalogName}. Error: ${error.message}`,
          error.stack,
        );
        // Do not re-throw, as notification failure should not typically halt primary operation
      }
    }

    async sendSyncSuccessNotification(
      merchantId: string,
      catalogName: string,
      adPlatform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform,
    ): Promise<void> {
      this.logger.log(`Preparing sync success notification for merchant ${merchantId}, catalog ${catalogName}`);
      try {
        const contactDetails = await this.merchantUserService.getMerchantUserContactDetails(merchantId);
         if (!contactDetails?.email) {
            this.logger.warn(`No email contact found for merchant ${merchantId}. Cannot send sync success notification.`);
            return;
        }

        const subject = `Product Catalog Sync Successful: ${catalogName} with ${adPlatform}`;
        const body = `
          <p>Dear Merchant,</p>
          <p>Good news! The synchronization of your product catalog '<strong>${catalogName}</strong>' with <strong>${adPlatform.toUpperCase()}</strong> was successful.</p>
          <p>Your products should now be updated on the advertising platform.</p>
          <p>Thank you,<br/>The AdManager Platform Team</p>
        `;
        // const templateId = 'productCatalogSyncSuccess';
        // const context = { catalogName, adPlatform };

         await this.notificationService.sendEmail({
            to: contactDetails.email,
            subject,
            body, // or templateId and context
        });
        this.logger.log(`Sync success notification sent to merchant ${merchantId} for catalog ${catalogName}`);
      } catch (error) {
        this.logger.error(
          `Failed to send sync success notification for merchant ${merchantId}, catalog ${catalogName}. Error: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}