import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from '../services/billing.service';

@Injectable()
export class SubscriptionRenewalJob {
  private readonly logger = new Logger(SubscriptionRenewalJob.name);

  constructor(private readonly billingService: BillingService) {}

  @Cron(CronExpression.DAILY_MIDNIGHT) // Example: Run daily at midnight
  // @Cron('0 0 * * *') // Alternative cron string for midnight
  async handleCron(): Promise<void> {
    this.logger.log('Starting daily subscription renewal job...');
    try {
      await this.billingService.processRenewals();
      this.logger.log('Daily subscription renewal job completed successfully.');
    } catch (error) {
      this.logger.error('Daily subscription renewal job failed:', error.stack);
      // Implement alerting for critical job failures
    }
  }
}