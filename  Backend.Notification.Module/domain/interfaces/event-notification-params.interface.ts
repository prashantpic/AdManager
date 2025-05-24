export interface IEventNotificationParams {
  topicArn: string;
  message: string; // SNS message must be a string. Object payloads should be stringified.
  subject?: string;
  messageAttributes?: Record<string, {
    DataType: 'String' | 'Number' | 'Binary' | 'String.Array';
    StringValue?: string;
    BinaryValue?: Uint8Array; // AWS SDK uses Uint8Array for Binary
    StringArrayValue?: string[];
  }>;
  messageDeduplicationId?: string; // For FIFO topics
  messageGroupId?: string; // For FIFO topics
}