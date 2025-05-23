import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
  MessageAttributeValue,
} from '@aws-sdk/client-sqs';
import { SQS_CLIENT } from './sqs.module';
import { ISqsProducerService } from './sqs.interface'; // Assuming this interface exists
import { CoreConfigService } from '../../config/config.service';

@Injectable()
export class SqsProducerService implements ISqsProducerService {
  private readonly logger = new Logger(SqsProducerService.name);

  constructor(
    @Inject(SQS_CLIENT) private readonly sqsClient: SQSClient,
    private readonly configService: CoreConfigService,
  ) {}

  async sendMessage<T>(
    queueNameOrUrl: string,
    payload: T,
    messageAttributes?: Record<string, MessageAttributeValue>,
    delaySeconds?: number,
    messageGroupId?: string, // For FIFO queues
    messageDeduplicationId?: string, // For FIFO queues
  ): Promise<SendMessageCommandOutput> {
    let queueUrl = queueNameOrUrl;
    // If it's a name, resolve to URL from config. This assumes queue URLs are in config.
    if (!queueNameOrUrl.startsWith('http')) {
        queueUrl = this.configService.getSqsQueueUrl(queueNameOrUrl);
        if (!queueUrl) {
            const errorMsg = `SQS Queue URL for name '${queueNameOrUrl}' not found in configuration.`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: messageAttributes,
      DelaySeconds: delaySeconds,
      MessageGroupId: messageGroupId, // Will be ignored by SQS for standard queues
      MessageDeduplicationId: messageDeduplicationId, // Will be ignored by SQS for standard queues
    });

    try {
      const result = await this.sqsClient.send(command);
      this.logger.log(
        `Message sent to SQS queue ${queueUrl} with ID: ${result.MessageId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error sending message to SQS queue ${queueUrl}:`,
        error,
      );
      throw error;
    }
  }
}