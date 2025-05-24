import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MerchantSubscribedEvent } from '../domain/events/definitions/merchant-subscribed.event';
import { MERCHANT_SUBSCRIBED_EVENT, SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX } from '../constants';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
// import { EntitlementService } from '../../entitlement/entitlement.service';
// import { NotificationService } from '../../notification/notification.service';
// import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';
// import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';

// Define a generic structure for status change events if specific ones are not created
interface SubscriptionStatusChangedPayload {
    subscriptionId: string;
    merchantId: string;
    oldStatus?: SubscriptionStatus; // Optional, might not always be available
    newStatus: SubscriptionStatus;
    planId?: string; // Helpful for entitlement updates
    reason?: string; // For cancellations, suspensions, terminations
}


@Injectable()
export class SubscriptionEventsListener {
  private readonly logger = new Logger(SubscriptionEventsListener.name);

  constructor(
    // @Inject(EntitlementService) private readonly entitlementService: EntitlementService,
    // @Inject(NotificationService) private readonly notificationService: NotificationService,
    // @Inject('IMerchantSubscriptionRepository') private readonly subscriptionRepo: IMerchantSubscriptionRepository,
    // @Inject('ISubscriptionPlanRepository') private readonly planRepo: ISubscriptionPlanRepository,
  ) {}

  @OnEvent(MERCHANT_SUBSCRIBED_EVENT)
  async handleMerchantSubscribedEvent(event: MerchantSubscribedEvent): Promise<void> {
    this.logger.log(`Received ${MERCHANT_SUBSCRIBED_EVENT} for merchant ${event.merchantId}, plan ${event.planId}, subscription ${event.subscriptionId}.`);

    // TODO:
    // 1. Grant entitlements:
    //    `await this.entitlementService.grantInitialEntitlements(event.merchantId, event.planId);`
    // 2. Send welcome/confirmation email:
    //    `await this.notificationService.sendSubscriptionWelcomeEmail(event.merchantId, event.planId);`

    this.logger.log(`Simulating entitlement grant and welcome notification for subscription ${event.subscriptionId}.`);
  }

  @OnEvent(`${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.*`, { async: true }) // Listen with wildcard
  async handleSubscriptionStatusChanged(payload: SubscriptionStatusChangedPayload, eventName?: string): Promise<void> {
    // eventName will be the specific event that matched, e.g., 'subscription.status.activated'
    const specificEventName = eventName || `${SUBSCRIPTION_STATUS_CHANGED_EVENT_PREFIX}.${payload.newStatus.toLowerCase()}`;
    this.logger.log(`Received ${specificEventName} for subscription ${payload.subscriptionId} to status ${payload.newStatus}. Merchant: ${payload.merchantId}.`);

    // TODO:
    // 1. Update entitlements based on the new status:
    //    `await this.entitlementService.updateEntitlementsForStatus(payload.merchantId, payload.planId, payload.newStatus);`
    //    This might involve revoking, suspending, or reactivating features.

    // 2. Send notification to merchant about the status change (if applicable for the status):
    switch (payload.newStatus) {
      case SubscriptionStatus.ACTIVE:
        if (payload.oldStatus && (payload.oldStatus === SubscriptionStatus.PAST_DUE || payload.oldStatus === SubscriptionStatus.SUSPENDED)) {
          this.logger.log(`Simulating "Subscription Reactivated" notification for ${payload.subscriptionId}.`);
          // `await this.notificationService.sendSubscriptionReactivatedEmail(payload.merchantId, payload.planId);`
        }
        break;
      case SubscriptionStatus.PAST_DUE:
        this.logger.log(`Simulating "Payment Past Due" notification for ${payload.subscriptionId}.`);
        // Dunning notifications are typically handled by BillingService or PaymentEventsListener logic.
        // This listener could handle a *final* past due notice if separate from dunning retries.
        break;
      case SubscriptionStatus.SUSPENDED:
        this.logger.log(`Simulating "Subscription Suspended" notification for ${payload.subscriptionId}.`);
        // `await this.notificationService.sendSubscriptionSuspendedEmail(payload.merchantId, payload.planId, payload.reason);`
        break;
      case SubscriptionStatus.CANCELLED:
        this.logger.log(`Simulating "Subscription Cancelled" confirmation for ${payload.subscriptionId}.`);
        // `await this.notificationService.sendSubscriptionCancellationConfirmation(payload.merchantId, payload.planId, effectiveEndDate);`
        break;
      case SubscriptionStatus.TERMINATED:
        this.logger.log(`Simulating "Subscription Terminated" notification for ${payload.subscriptionId}.`);
        // `await this.notificationService.sendSubscriptionTerminatedEmail(payload.merchantId, payload.planId, payload.reason);`
        break;
      default:
        this.logger.log(`No specific notification action for status ${payload.newStatus} on subscription ${payload.subscriptionId}.`);
    }
    this.logger.log(`Simulating entitlement update for subscription ${payload.subscriptionId} to status ${payload.newStatus}.`);
  }
}