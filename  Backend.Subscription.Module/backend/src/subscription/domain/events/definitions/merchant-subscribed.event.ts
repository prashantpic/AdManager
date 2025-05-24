import { MERCHANT_SUBSCRIBED_EVENT } from '../../../constants';

export class MerchantSubscribedEvent {
  public readonly eventName: string = MERCHANT_SUBSCRIBED_EVENT;
  public readonly occurredAt: Date;

  constructor(
    public readonly subscriptionId: string,
    public readonly merchantId: string,
    public readonly planId: string,
  ) {
    this.occurredAt = new Date();
  }
}