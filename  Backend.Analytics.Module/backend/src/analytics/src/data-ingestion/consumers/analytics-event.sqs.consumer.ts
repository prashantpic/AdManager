import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs'; // Assuming Message type is from aws-sdk
import { DataIngestionService } from '../services/data-ingestion.service';
import { IAnalyticsDataPoint } from '../../common/interfaces/analytics-data-point.interface';

// Placeholder for a real SQS message handler decorator if one were used from a NestJS SQS library.
// For this exercise, we'll assume a polling mechanism calls `handleMessage`.
// e.g. @SqsMessageHandler(configService.get('analytics.sqs_ingestion_queue_name'), false)
// The 'analytics_ingestion_queue_name_from_config' implies dynamic queue name from config.

/**
 * SQS consumer responsible for polling and processing messages containing
 * raw analytics events from the main ingestion queue.
 */
@Injectable()
export class AnalyticsEventSqsConsumer {
  private readonly logger = new Logger(AnalyticsEventSqsConsumer.name);
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(
    private readonly dataIngestionService: DataIngestionService,
    private readonly configService: ConfigService,
  ) {
    // In a real scenario, SQS client and queue URL would be initialized
    // and polling would be managed by a dedicated SQS module or service.
    // This is a simplified representation for the purpose of this exercise.
    this.queueUrl = this.configService.get<string>('analytics.sqs_ingestion_queue_url');
    if (this.queueUrl) {
        this.sqsClient = new SQSClient({ region: this.configService.get<string>('AWS_REGION') }); // Region from config
        this.logger.log(`SQS Consumer configured for queue: ${this.queueUrl}`);
        // Polling logic would start here, e.g., this.startPolling();
    } else {
        this.logger.warn('SQS Ingestion Queue URL not configured. Consumer will not run.');
    }
  }

  /**
   * Processes a single message from the SQS queue.
   * This method would be called by an SQS message listener/poller.
   * @param message The SQS message.
   */
  public async handleMessage(message: Message): Promise<void> {
    this.logger.log(`Received SQS message: ${message.MessageId}`);
    if (!message.Body) {
      this.logger.warn(`Message ${message.MessageId} has no body. Skipping.`);
      // Optionally delete message if it's considered invalid permanently
      await this.deleteMessageFromQueue(message.ReceiptHandle);
      return;
    }

    try {
      const eventData: IAnalyticsDataPoint = JSON.parse(message.Body);
      // Basic validation
      if (!eventData.merchantId || !eventData.eventTimestamp || !eventData.eventType || !eventData.eventSource || !eventData.payload) {
          this.logger.error(`Invalid event data structure in message ${message.MessageId}: ${message.Body}`);
          // Move to DLQ or log and delete
          await this.deleteMessageFromQueue(message.ReceiptHandle);
          return;
      }
      // Ensure eventTimestamp is a Date object
      eventData.eventTimestamp = new Date(eventData.eventTimestamp);


      await this.dataIngestionService.handleIncomingEvent(eventData);
      this.logger.log(`Successfully processed SQS message: ${message.MessageId}`);
      await this.deleteMessageFromQueue(message.ReceiptHandle);
    } catch (error) {
      this.logger.error(
        `Failed to process SQS message ${message.MessageId}: ${error.message}`,
        error.stack,
      );
      // Depending on the error, decide whether to delete or let it be re-processed (visibility timeout)
      // For persistent errors, a DLQ is essential.
      // For this example, we'll assume errors are transient or should not block the queue indefinitely without a DLQ.
      // If no DLQ, be cautious with auto-deleting failing messages.
    }
  }

  private async deleteMessageFromQueue(receiptHandle: string): Promise<void> {
    if (!this.sqsClient || !this.queueUrl || !receiptHandle) return;
    try {
      const deleteParams = {
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      };
      await this.sqsClient.send(new DeleteMessageCommand(deleteParams));
      this.logger.debug(`Message with receipt handle ${receiptHandle} deleted from queue.`);
    } catch (error) {
      this.logger.error(`Error deleting message with receipt handle ${receiptHandle}: ${error.message}`, error.stack);
    }
  }

  // Placeholder for a poller function if not using a NestJS SQS library
  // async startPolling(): Promise<void> {
  //   this.logger.log('SQS Polling started...');
  //   while (true) { // Basic polling loop, needs proper error handling and shutdown
  //     try {
  //       const receiveParams = {
  //         QueueUrl: this.queueUrl,
  //         MaxNumberOfMessages: 10,
  //         WaitTimeSeconds: 20,
  //         VisibilityTimeout: 60, // Adjust as needed
  //       };
  //       const data = await this.sqsClient.send(new ReceiveMessageCommand(receiveParams));
  //       if (data.Messages && data.Messages.length > 0) {
  //         for (const message of data.Messages) {
  //           await this.handleMessage(message);
  //         }
  //       }
  //     } catch (error) {
  //       this.logger.error(`Error polling SQS: ${error.message}`, error.stack);
  //       await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
  //     }
  //   }
  // }
}