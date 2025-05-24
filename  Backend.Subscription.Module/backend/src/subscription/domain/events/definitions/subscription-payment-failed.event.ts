import { SUBSCRIPTION_PAYMENT_FAILED_EVENT } from '../../../constants';

export class SubscriptionPaymentFailedEvent {
  public readonly eventName: string = SUBSCRIPTION_PAYMENT_FAILED_EVENT;
  public readonly occurredAt: Date;

  constructor(
    public readonly subscriptionId: string,
    public readonly merchantId: string,
    public readonly attemptCount: number,
    public readonly reason: string, // Reason for payment failure
  ) {
    this.occurredAt = new Date();
  }
}