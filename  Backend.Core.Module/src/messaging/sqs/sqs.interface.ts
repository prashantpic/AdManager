```typescript
import {
  MessageAttributeValue,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';

/**
 * Type definition for SQS Message Attributes.
 * Keys are attribute names, values are `MessageAttributeValue` objects.
 */
export type MessageAttributeValueMap = Record<string, MessageAttributeValue>;

/**
 * @interface ISqsProducerService
 * @description Defines the contract for SQS producer services,
 * specifying methods for sending messages to SQS queues.
 */
export interface ISqsProducerService {
  /**
   * Sends a message to a specified SQS queue.
   * @template T The type of the message payload.
   * @param queueUrl The URL of the SQS queue.
   * @param payload The message payload. Will be JSON stringified.
   * @param messageAttributes Optional. SQS message attributes.
   * @param delaySeconds Optional. The length of time, in seconds, for which to delay a specific message.
   * @param messageDeduplicationId Optional. The token used for deduplication of sent messages (for FIFO queues).
   * @param messageGroupId Optional. The tag that specifies that a message belongs to a specific message group (for FIFO queues).
   * @returns A promise that resolves to the `SendMessageCommandOutput` from AWS SDK.
   */
  sendMessage<T>(
    queueUrl: string,
    payload: T,
    messageAttributes?: MessageAttributeValueMap,
    delaySeconds?: number,
    messageDeduplicationId?: string,
    messageGroupId?: string,
  ): Promise<SendMessageCommandOutput>;
}

/**
 * Token for injecting the SqsProducerService.
 */
export const ISqsProducerService = Symbol('ISqsProducerService');
```