import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
  MessageAttributeValue,
} from '@aws-sdk/client-sqs';
import { ISqsProducerService } from './sqs.interface';
import { SQS_CLIENT_TOKEN } from './sqs.module';

@Injectable()
export class SqsProducerService implements ISqsProducerService {
  private readonly logger = new Logger(SqsProducerService.name);

  constructor(
    @Inject(SQS_CLIENT_TOKEN) private readonly sqsClient: SQSClient,
  ) {}

  async sendMessage<T>(
    queueUrl: string,
    payload: T,
    messageAttributes?: Record<string, MessageAttributeValue>,
    delaySeconds?: number,
    messageGroupId?: string, // For FIFO queues
    messageDeduplicationId?: string, // For FIFO queues
  ): Promise<SendMessageCommandOutput> {
    const messageBody = JSON.stringify(payload);

    const params: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: messageAttributes,
      DelaySeconds: delaySeconds,
    };

    if (messageGroupId) {
        params.MessageGroupId = messageGroupId;
    }
    if (messageDeduplicationId) {
        params.MessageDeduplicationId = messageDeduplicationId;
    }

    try {
      const command = new SendMessageCommand(params);
      const result = await this.sqsClient.send(command);
      this.logger.log(
        `Message sent to SQS queue ${queueUrl} with ID: ${result.MessageId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error sending message to SQS queue ${queueUrl}`,
        error.stack,
      );
      throw error;
    }
  }
}