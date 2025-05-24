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
    @Inject(ConfigService) private readonly configService: ConfigService<NotificationConfig>,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    const notificationConfigValues = this.configService.get<NotificationConfig['sns']>('sns', { infer: true });
    const rootAwsRegion = this.configService.get<string>('awsRegion', { infer: true });
    
    const region = notificationConfigValues.region || rootAwsRegion;

    if (!region) {
      const errorMsg = 'AWS region for SNS is not configured.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    this.snsClient = new SNSClient({ region });
    this.logger.log(`SnsAdapter initialized. Region: ${region}`);
  }

  async publishEvent(params: IEventNotificationParams): Promise<{ messageId?: string; error?: any; statusCode?: number }> {
    this.logger.log(`Attempting to publish event to SNS topic: ${params.topicArn}`);

    const commandInput: PublishCommandInput = {
      TopicArn: params.topicArn,
      Message: params.message,
    };

    if (params.subject) {
      commandInput.Subject = params.subject.substring(0, MAX_SNS_SUBJECT_LENGTH);
    }

    if (params.messageAttributes) {
        commandInput.MessageAttributes = Object.entries(params.messageAttributes).reduce((acc, [key, value]) => {
            const attributeValue: MessageAttributeValue = { DataType: value.DataType };
            if (value.DataType === 'String' && value.StringValue !== undefined) {
                attributeValue.StringValue = value.StringValue;
            } else if (value.DataType === 'Binary' && value.BinaryValue !== undefined) {
                attributeValue.BinaryValue = value.BinaryValue;
            } else if (value.DataType === 'Number' && value.StringValue !== undefined) { // SNS Number type is sent as String
                attributeValue.StringValue = value.StringValue;
            } else if (value.DataType === 'String.Array' && value.StringArrayValue !== undefined) {
                attributeValue.StringValue = JSON.stringify(value.StringArrayValue); // String.Array is sent as a JSON string
            }
            acc[key] = attributeValue;
            return acc;
        }, {} as Record<string, MessageAttributeValue>);
    }

    if (params.messageDeduplicationId) {
      commandInput.MessageDeduplicationId = params.messageDeduplicationId;
    }
    if (params.messageGroupId) {
      commandInput.MessageGroupId = params.messageGroupId;
    }

    try {
      this.logger.debug('Publishing SNS event with input:', JSON.stringify(commandInput, null, 2));
      const response: PublishCommandOutput = await this.snsClient.send(new PublishCommand(commandInput));
      this.logger.log(`SNS event published successfully. MessageId: ${response.MessageId}`);
      return { messageId: response.MessageId, statusCode: response.$metadata.httpStatusCode };
    } catch (error) {
      this.logger.error(`Failed to publish SNS event to topic ${params.topicArn}. Error: ${error.message}`, error.stack);
      return {
        error: { name: error.name, message: error.message, stack: error.stack },
        statusCode: error.$metadata?.httpStatusCode,
      };
    }
  }
}