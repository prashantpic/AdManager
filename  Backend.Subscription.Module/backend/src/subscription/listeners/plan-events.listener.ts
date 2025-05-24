import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PlanPriceChangedEvent } from '../domain/events/definitions/plan-price-changed.event';
import { PLAN_PRICE_CHANGED_EVENT } from '../constants';
// import { NotificationService } from '../../notification/notification.service';
// import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';

@Injectable()
export class PlanEventsListener {
  private readonly logger = new Logger(PlanEventsListener.name);

  constructor(
    // @Inject(NotificationService) private readonly notificationService: NotificationService,
    // @Inject('IMerchantSubscriptionRepository') private readonly subscriptionRepo: IMerchantSubscriptionRepository,
  ) {}

  @OnEvent(PLAN_PRICE_CHANGED_EVENT)
  async handlePlanPriceChangedEvent(event: PlanPriceChangedEvent): Promise<void> {
    this.logger.log(`Received ${PLAN_PRICE_CHANGED_EVENT} for plan ${event.planId}`);

    // TODO:
    // 1. Fetch all active subscriptions for this planId (e.g., `this.subscriptionRepo.findAllActiveByPlanId(event.planId)`).
    // 2. For each subscription:
    //    a. Determine if grandfathering applies based on policy.
    //    b. If not grandfathered or if price increases, send a notification to the merchant.
    //       - The notification should detail the old price, new price, and effective date.
    //       - `await this.notificationService.sendPlanPriceChangeNotification(merchantId, event.planId, event.oldPricing, event.newPricing);`
    //    c. Potentially schedule a future task to apply the new price if it's not immediate.

    this.logger.log(`Simulating notification to merchants about price change for plan ${event.planId}.`);
    // Example:
    // const affectedSubscriptions = await this.subscriptionRepo.findAllActiveByPlanId(event.planId);
    // for (const sub of affectedSubscriptions) {
    //   this.logger.log(`Notifying merchant ${sub.merchantId} for subscription ${sub.id}`);
    //   // await this.notificationService.sendPlanPriceChangeNotification(sub.merchantId, ...);
    // }
  }
}