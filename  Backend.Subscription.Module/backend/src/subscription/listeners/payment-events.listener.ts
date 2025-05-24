import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionPaymentFailedEvent } from '../domain/events/definitions/subscription-payment-failed.event';
import { SUBSCRIPTION_PAYMENT_FAILED_EVENT } from '../constants';
import { BillingService } from '../services/billing.service'; // Import BillingService

@Injectable()
export class PaymentEventsListener {
  private readonly logger = new Logger(PaymentEventsListener.name);

  constructor(private readonly billingService: BillingService) {}

  @OnEvent(SUBSCRIPTION_PAYMENT_FAILED_EVENT)
  async handleSubscriptionPaymentFailedEvent(event: SubscriptionPaymentFailedEvent): Promise<void> {
    this.logger.log(`Received ${SUBSCRIPTION_PAYMENT_FAILED_EVENT} for subscription ${event.subscriptionId}, merchant ${event.merchantId}, attempt ${event.attemptCount}. Reason: ${event.reason}`);

    // Delegate to BillingService to handle the dunning process.
    // BillingService.handleFailedPayment will contain logic for retries, notifications, and status escalations.
    try {
      await this.billingService.handleFailedPayment(event.subscriptionId, event.reason);
    } catch (error) {
      this.logger.error(
        `Error in BillingService.handleFailedPayment for subscription ${event.subscriptionId}:`,
        error,
      );
      // Consider further error handling or alerting if dunning step itself fails.
    }
  }
}