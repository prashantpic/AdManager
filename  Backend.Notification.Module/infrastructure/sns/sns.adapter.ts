import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
  PublishCommandOutput,
  MessageAttributeValue,
} from '@aws-sdk/client-sns';
import { IEventNotificationParams } from '../../domain/interfaces/event-notification-params.interface';
import { NotificationConfig } from '../../config/notification.config';
import { MAX_SNS_SUBJECT_LENGTH } from '../../constants/notification.constants';

@Injectable()
export class SnsAdapter {
  private readonly snsClient: SNSClient;

  constructor(
    @Inject(notificationConfig.KEY) private readonly notifConfig: NotificationConfig,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const region = this.notifConfig.sns.region || this.notifConfig.awsRegion;
    this.snsClient = new SNSClient({
      region: region,
      // Credentials should be handled by the execution environment (e.g., IAM role)
    });
    this.logger.log(`SnsAdapter initialized. Region: ${region}`, SnsAdapter.name);
  }

  async publishEvent(params: IEventNotificationParams): Promise<{ messageId?: string; error?: any; statusCode?: number }> {
    this.logger.log(`Attempting to publish event to SNS Topic: ${params.topicArn}`, SnsAdapter.name);

    // AWS SDK v3 requires specific structure for MessageAttributes
    let awsMessageAttributes: Record<string, MessageAttributeValue> | undefined = undefined;
    if (params.messageAttributes) {
        awsMessageAttributes = {};
        for (const key in params.messageAttributes) {
            if (Object.prototype.hasOwnProperty.call(params.messageAttributes, key)) {
                const attr = params.messageAttributes[key];
                awsMessageAttributes[key] = {
                    DataType: attr.DataType,
                    StringValue: attr.StringValue,
                    BinaryValue: attr.BinaryValue, // Ensure this is Uint8Array if provided
                    StringListValues: attr.StringArrayValue, // AWS SDK v3 uses StringListValues for String.Array
                };
            }
        }
    }

    const commandInput: PublishCommandInput = {
      TopicArn: params.topicArn,
      Message: params.message, // Message is already stringified in the service
      Subject: params.subject?.substring(0, MAX_SNS_SUBJECT_LENGTH),
      MessageAttributes: awsMessageAttributes,
      MessageDeduplicationId: params.messageDeduplicationId,
      MessageGroupId: params.messageGroupId,
    };

    try {
      const command = new PublishCommand(commandInput);
      const result: PublishCommandOutput = await this.snsClient.send(command);
      this.logger.log(`Event published successfully to SNS. MessageId: ${result.MessageId}`, SnsAdapter.name);
      return { messageId: result.MessageId, statusCode: result.$metadata.httpStatusCode };
    } catch (error) {
      this.logger.error(`Error publishing event to SNS: ${error.message}`, error.stack, SnsAdapter.name);
      return {
        error: { message: error.message, name: error.name, stack: error.stack },
        statusCode: error.$metadata?.httpStatusCode || 500,
      };
    }
  }
}