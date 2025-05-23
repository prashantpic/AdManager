import { Injectable, Logger } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumer } from '@ssut/nestjs-sqs';
import { Message as SQSMessage } from '@aws-sdk/client-sqs'; // Type for SQS message
import { ProductCatalogService } from '../../../application/services/product-catalog.service';
import { ProductCatalogConstants } from '../../../application/constants/product-catalog.constants';
import { AdManager } from '../../../../domain/common/enums/ad-platform.enum';

// Define a type for the expected message payload
interface SyncTriggerMessagePayload {
  catalogId: string;
  merchantId: string;
  adPlatform: AdManager.Platform.Backend.ProductCatalog.Domain.Common.AdPlatform;
  triggerType: 'MANUAL_SYNC' | 'WEBHOOK_PRODUCT_UPDATE' | 'SCHEDULED_SYNC_JOB_ENQUEUED'; // Example trigger types
  // additional event details for WEBHOOK_PRODUCT_UPDATE if needed
  webhookPayload?: any; // For WebhookPayloadDto type data
  source?: string; // e.g. 'inventory_webhook', 'scheduler'
}


export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Messaging {
  /**
   * SQS consumer for catalog synchronization trigger events.
   * Processes asynchronous messages from SQS that signal a need for catalog synchronization.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  @SqsConsumer(
      ProductCatalogConstants.SQS_QUEUE_CATALOG_SYNC_TRIGGER,
      { 
        batchSize: 1, // Process one message at a time for simplicity, adjust as needed
        visibilityTimeout: 300, // 5 minutes, should be longer than expected processing time
        waitTimeSeconds: 10, // Enable long polling
      }
  )
  export class SqsCatalogSyncConsumer {
    private readonly logger = new Logger(SqsCatalogSyncConsumer.name);

    constructor(private readonly productCatalogService: ProductCatalogService) {}

    /**
     * Handles messages from the SQS queue to trigger catalog synchronization or process webhook data.
     * Message body is expected to contain catalogId, platform, merchantId, and trigger details.
     * @param message The SQS message object.
     */
    @SqsMessageHandler(ProductCatalogConstants.SQS_QUEUE_CATALOG_SYNC_TRIGGER, false /* autoDelete = false */)
    async handleSyncTriggerMessage(message: SQSMessage): Promise<void> {
      this.logger.log(`Received SQS message: ID ${message.MessageId}`);

      let payload: SyncTriggerMessagePayload;
      try {
        if (!message.Body) {
          this.logger.error('SQS message body is empty.');
          // Acknowledge and remove message if no body, or move to DLQ strategy
          return;
        }
        payload = JSON.parse(message.Body) as SyncTriggerMessagePayload;
        this.logger.debug(`Parsed SQS message payload: ${JSON.stringify(payload)}`);
      } catch (error) {
        this.logger.error(`Failed to parse SQS message body: ${message.Body}. Error: ${error.message}`, error.stack);
        // Message will not be auto-deleted, SQS will redrive based on queue policy (DLQ)
        // Or, explicitly throw to ensure it's not deleted if autoDelete were true.
        throw error; // This will make @ssut/nestjs-sqs not delete the message
      }

      // Basic validation of payload
      if (!payload.catalogId || !payload.merchantId || !payload.adPlatform || !payload.triggerType) {
          this.logger.error('Invalid SQS message payload structure. Missing required fields.', payload);
          throw new Error('Invalid SQS message payload structure.');
      }

      try {
        switch (payload.triggerType) {
          case 'WEBHOOK_PRODUCT_UPDATE':
            if (payload.webhookPayload) {
              this.logger.log(`Processing inventory update webhook for merchant ${payload.merchantId} via SQS.`);
              // Assuming processInventoryUpdateWebhook can derive catalogId and adPlatform
              // or that the webhookPayload itself contains what's needed.
              // The current processInventoryUpdateWebhook takes (payload, platformIdentifier)
              // We might need to adapt or enrich the message.
              // For now, let's assume platformIdentifier is part of webhookPayload or adPlatform from SQS message.
              await this.productCatalogService.processInventoryUpdateWebhook(
                payload.webhookPayload, // This should be WebhookPayloadDto
                payload.adPlatform.toString(), // platformIdentifier
              );
            } else {
              this.logger.warn(`Webhook trigger type received for catalog ${payload.catalogId} but no webhookPayload found.`);
            }
            break;
          
          case 'MANUAL_SYNC':
          case 'SCHEDULED_SYNC_JOB_ENQUEUED': // If scheduler enqueues instead of direct call
            this.logger.log(`Initiating sync for catalog ID: ${payload.catalogId}, Platform: ${payload.adPlatform} due to ${payload.triggerType}.`);
            await this.productCatalogService.initiateSyncForPlatform(
              payload.catalogId,
              payload.adPlatform,
              payload.merchantId,
            );
            break;

          default:
            this.logger.warn(`Unknown triggerType in SQS message: ${payload.triggerType}`);
            throw new Error(`Unknown triggerType: ${payload.triggerType}`);
        }
        this.logger.log(`Successfully processed SQS message for catalog ID: ${payload.catalogId}`);
        // If autoDelete is false, message needs to be deleted manually upon success
        // However, @ssut/nestjs-sqs handles deletion on successful promise resolution if autoDelete is not set or true.
        // If an error is thrown, it won't be deleted.
      } catch (error) {
        this.logger.error(
          `Error processing SQS message for catalog ID: ${payload.catalogId}. Error: ${error.message}`,
          error.stack,
        );
        // Re-throw to ensure SQS handles redrive/DLQ
        throw error;
      }
    }
  }
}