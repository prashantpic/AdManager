import { OrderStatus } from '../enums/order-status.enum';

/**
 * Event indicating a change in the status of an order.
 * Signals a change in an order's lifecycle status, allowing other parts of the system to react.
 */
export class OrderStatusChangedEvent {
  public readonly orderId: string;
  public readonly oldStatus: OrderStatus;
  public readonly newStatus: OrderStatus;
  public readonly merchantId: string; // For routing/filtering events
  public readonly customerId?: string; // For customer notifications
  public readonly occurredOn: Date;

  constructor(
    orderId: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
    merchantId: string,
    customerId?: string,
  ) {
    this.orderId = orderId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
    this.merchantId = merchantId;
    this.customerId = customerId;
    this.occurredOn = new Date();
  }
}