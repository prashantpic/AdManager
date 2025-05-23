```typescript
import {
  MessageAttributeValue,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';

/**
 * @description Map of SQS message attributes.
 * The key is the attribute name, and the value is a MessageAttributeValue object.
 */
export type SqsMessageAttributeMap = Record<string, MessageAttributeValue>;

/**
 * @interface ISqsProducerService
 * @description Defines the contract for an SQS producer service,
 * responsible for sending messages to AWS SQS queues.
 */
export interface ISqsProducerService {
  /**
   * Sends a message to a specified SQS queue.
   * @template T - The type of the message payload.
   * @param queueUrl - The URL of the SQS queue.
   * @param payload - The message payload to send. Will be JSON stringified.
   * @param messageAttributes - Optional SQS message attributes.
   * @param delaySeconds - Optional delay in seconds for the message (0-900).
   * @param messageGroupId - Optional. Required for FIFO queues. Specifies the message group ID.
   * @param messageDeduplicationId - Optional. Required for FIFO queues if content-based deduplication is not enabled.
   * @returns A promise that resolves to the SendMessageCommandOutput from AWS SDK.
   */
  sendMessage<T>(
    queueUrl: string,
    payload: T,
    messageAttributes?: SqsMessageAttributeMap,
    delaySeconds?: number,
    messageGroupId?: string,
    messageDeduplicationId?: string,
  ): Promise<SendMessageCommandOutput>;
}

export const ISqsProducerService = Symbol('ISqsProducerService');
```