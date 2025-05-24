import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter'; // Assuming @nestjs/event-emitter is used
import { EntitlementService } from '../services/entitlement.service';
import { SubscriptionChangedEventDto } from '../dto/subscription-changed.event.dto';
import { SUBSCRIPTION_CHANGED_EVENT } from '../constants/entitlement.constants';

@Injectable()
export class SubscriptionPlanChangeListener {
  private readonly logger = new Logger(SubscriptionPlanChangeListener.name);

  constructor(private readonly entitlementService: EntitlementService) {}

  @OnEvent(SUBSCRIPTION_CHANGED_EVENT, { async: true }) // Listen for the event
  async handleSubscriptionChangedEvent(payload: SubscriptionChangedEventDto): Promise<void> {
    this.logger.log(
      `Received ${SUBSCRIPTION_CHANGED_EVENT} event for merchant ${payload.merchantId}, new plan: ${payload.newPlanId}, type: ${payload.changeType}`,
    );
    try {
      await this.entitlementService.handleSubscriptionChange(payload);
      this.logger.log(
        `Successfully processed ${SUBSCRIPTION_CHANGED_EVENT} for merchant ${payload.merchantId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing ${SUBSCRIPTION_CHANGED_EVENT} for merchant ${payload.merchantId}: ${error.message}`,
        error.stack,
      );
      // Depending on the event system, might need to handle nack/retry or DLQ logic here or in the event infra.
    }
  }
}