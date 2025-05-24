export interface IEventNotificationParams {
  topicArn: string;
  message: string; // Message payload, should be stringified if an object
  subject?: string;
  messageAttributes?: Record<string, { DataType: 'String' | 'Number' | 'Binary' | 'String.Array'; StringValue?: string; BinaryValue?: Uint8Array; StringArrayValue?: string[]; }>;
  messageDeduplicationId?: string; // For FIFO topics
  messageGroupId?: string; // For FIFO topics
}