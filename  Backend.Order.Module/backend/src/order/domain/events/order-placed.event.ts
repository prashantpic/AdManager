/**
 * Event indicating a new order has been placed.
 * Signals that a new order has been successfully created and is ready for further processing.
 */
export class OrderPlacedEvent {
  public readonly orderId: string;
  public readonly merchantId: string;
  public readonly customerId?: string; // Optional customer ID
  public readonly totalAmount: number;
  public readonly currency: string;
  public readonly occurredOn: Date;

  constructor(
    orderId: string,
    merchantId: string,
    totalAmount: number,
    currency: string,
    customerId?: string,
  ) {
    this.orderId = orderId;
    this.merchantId = merchantId;
    this.customerId = customerId;
    this.totalAmount = totalAmount;
    this.currency = currency;
    this.occurredOn = new Date();
  }
}