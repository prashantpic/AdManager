import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import { SqsOrderEventPublisher } from '../../infrastructure/event-publishers/sqs-order-event.publisher';
// Import other services needed for side effects, e.g., from Analytics or Affiliate modules
// import { AnalyticsService } from '@analytics/analytics.service';
// import { AffiliateCommissionService } from '@affiliate/affiliate-commission.service';

/**
 * Handles domain events related to orders.
 * This handler listens for events emitted by the Order domain
 * and triggers further actions, such as publishing integration events.
 */
@Injectable()
export class OrderPlacedHandler { // Renamed to OrderEventHandler for broader scope if handling multiple events
  constructor(
    private readonly sqsOrderEventPublisher: SqsOrderEventPublisher,
    // @Inject(AnalyticsService) private readonly analyticsService: AnalyticsService, // Example
    // @Inject(AffiliateCommissionService) private readonly affiliateCommissionService: AffiliateCommissionService, // Example
  ) {}

  /**
   * Handles the OrderPlacedEvent.
   * This method is triggered when an order is successfully placed.
   * It publishes an integration event to SQS for consumption by other modules.
   * @param event The OrderPlacedEvent payload.
   */
  @OnEvent('order.placed') // Matches the event name used in OrderService
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    console.log(`[OrderPlacedHandler] Received OrderPlacedEvent for orderId: ${event.orderId}`);
    try {
      // Publish to SQS for Analytics, Affiliate, etc.
      await this.sqsOrderEventPublisher.publishOrderPlacedEvent(event);
      console.log(`[OrderPlacedHandler] Successfully published OrderPlacedEvent to SQS for orderId: ${event.orderId}`);

      // Example: Trigger analytics processing
      // await this.analyticsService.recordSale(event);

      // Example: Trigger affiliate commission calculation
      // await this.affiliateCommissionService.calculateCommission(event);

    } catch (error) {
      console.error(`[OrderPlacedHandler] Error handling OrderPlacedEvent for orderId ${event.orderId}:`, error);
      // Implement retry logic or dead-letter queuing for event publishing failures if necessary
    }
  }

  /**
   * Handles the OrderStatusChangedEvent.
   * This method is triggered when an order's status changes.
   * It publishes an integration event to SQS.
   * @param event The OrderStatusChangedEvent payload.
   */
  @OnEvent('order.status.changed') // Matches the event name used in OrderService
  async handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    console.log(`[OrderPlacedHandler] Received OrderStatusChangedEvent for orderId: ${event.orderId}, new status: ${event.newStatus}`);
    try {
      await this.sqsOrderEventPublisher.publishOrderStatusChangedEvent(event);
      console.log(`[OrderPlacedHandler] Successfully published OrderStatusChangedEvent to SQS for orderId: ${event.orderId}`);

      // Example: Notify customer about status change (via a NotificationService)
      // if (event.newStatus === OrderStatus.SHIPPED) {
      //   await this.notificationService.sendOrderShippedEmail(event.orderId);
      // }

    } catch (error) {
      console.error(`[OrderPlacedHandler] Error handling OrderStatusChangedEvent for orderId ${event.orderId}:`, error);
    }
  }
}