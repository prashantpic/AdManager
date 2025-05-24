import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';
import { BillingService } from '../services/billing.service';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { MerchantSubscriptionAggregate } from '../domain/aggregates/merchant-subscription.aggregate';
import { SubscriptionModuleConfig } from '../config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DunningCycleJob {
  private readonly logger = new Logger(DunningCycleJob.name);
  private readonly config: SubscriptionModuleConfig;


  constructor(
    @Inject('IMerchantSubscriptionRepository')
    private readonly subscriptionRepository: IMerchantSubscriptionRepository,
    private readonly billingService: BillingService,
    private readonly nestjsConfigService: ConfigService,
  ) {
    this.config = this.nestjsConfigService.get<SubscriptionModuleConfig>('subscription', { infer: true });
     if (!this.config) {
        this.logger.warn('SubscriptionModuleConfig not found for DunningCycleJob. Using default values.');
        this.config = { dunningRetryAttempts: 3, prorationPolicy: 'prorated_credit_on_next_invoice', dunningRetryIntervalHours: 24, suspensionAfterDaysPastDue: 7, terminationAfterDaysSuspended: 14 };
    }
  }

  // Example: Run every 4 hours. Adjust as per dunning policy.
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleCron(): Promise<void> {
    this.logger.log('Starting dunning cycle job...');
    try {
      const now = new Date();
      const subscriptionsInDunning = await this.subscriptionRepository.findInDunning(now);

      if (subscriptionsInDunning.length === 0) {
        this.logger.log('No subscriptions currently in dunning process.');
        return;
      }

      this.logger.log(`Found ${subscriptionsInDunning.length} subscriptions in dunning state.`);

      for (const subscription of subscriptionsInDunning) {
        this.logger.log(`Processing dunning for subscription ${subscription.id} (Status: ${subscription.status}, Attempts: ${subscription.dunningAttempts}).`);

        if (subscription.status === SubscriptionStatus.PAST_DUE) {
          // Check if it's time for another retry attempt
          const hoursSinceLastAttempt = subscription.lastPaymentAttempt
            ? (now.getTime() - subscription.lastPaymentAttempt.getTime()) / (1000 * 60 * 60)
            : Infinity; // If no last attempt, retry immediately

          if (hoursSinceLastAttempt >= (this.config.dunningRetryIntervalHours || 24)) {
            this.logger.log(`Retrying payment for PAST_DUE subscription ${subscription.id}.`);
            // BillingService.collectSubscriptionFee will internally call BillingService.handleFailedPayment on failure.
            await this.billingService.collectSubscriptionFee(subscription.id);
          } else {
            this.logger.log(`Subscription ${subscription.id} not yet due for retry (last attempt ${hoursSinceLastAttempt.toFixed(1)}h ago).`);
          }
        } else if (subscription.status === SubscriptionStatus.SUSPENDED) {
          // Check if suspension period has elapsed for termination
          const daysSuspended = subscription.lastStatusChangeDate // Assuming this field exists and is updated
            ? (now.getTime() - subscription.lastStatusChangeDate.getTime()) / (1000 * 60 * 60 * 24)
            : 0;

          if (daysSuspended >= (this.config.terminationAfterDaysSuspended || 14)) {
            this.logger.log(`Subscription ${subscription.id} suspended for ${daysSuspended.toFixed(0)} days. Terminating.`);
            subscription.terminate(now); // Call aggregate method
            await this.subscriptionRepository.save(subscription); // Persist change
            subscription.pullEvents().forEach(event => this.billingService.eventEmitter.emit(event.name, event)); // Emit events
            // this.billingService.notificationService.sendSubscriptionTerminatedNotification(...); // Send notification
          } else {
            this.logger.log(`Subscription ${subscription.id} suspension period not yet met for termination (${daysSuspended.toFixed(0)}/${this.config.terminationAfterDaysSuspended || 14} days).`);
          }
        }
      }
      this.logger.log('Dunning cycle job completed successfully.');
    } catch (error) {
      this.logger.error('Dunning cycle job failed:', error.stack);
      // Implement alerting for critical job failures
    }
  }
}