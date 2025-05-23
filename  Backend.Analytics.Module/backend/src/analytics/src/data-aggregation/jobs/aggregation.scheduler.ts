import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataAggregatorService } from '../services/data-aggregator.service';

/**
 * Contains scheduled tasks (cron jobs) for triggering hourly and daily data aggregations.
 */
@Injectable()
export class AggregationScheduler {
  private readonly logger = new Logger(AggregationScheduler.name);

  constructor(private readonly dataAggregatorService: DataAggregatorService) {}

  /**
   * Scheduled job to run hourly aggregation.
   * This job will typically aggregate data for the *previous* complete hour.
   */
  @Cron(CronExpression.EVERY_HOUR) // Runs at the beginning of every hour
  async handleHourlyAggregationCron(): Promise<void> {
    this.logger.log('Hourly aggregation cron job started.');
    try {
      const now = new Date();
      // Aggregate for the previous hour
      const targetHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() -1 );
      await this.dataAggregatorService.triggerHourlyAggregation(targetHour);
      this.logger.log('Hourly aggregation cron job finished successfully.');
    } catch (error) {
      this.logger.error('Hourly aggregation cron job failed:', error);
    }
  }

  /**
   * Scheduled job to run daily aggregation.
   * This job will typically aggregate data for the *previous* complete day.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Runs at 00:00 server time
  async handleDailyAggregationCron(): Promise<void> {
    this.logger.log('Daily aggregation cron job started.');
    try {
      const now = new Date();
      // Aggregate for the previous day
      const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() -1 );
      await this.dataAggregatorService.triggerDailyAggregation(targetDay);
      this.logger.log('Daily aggregation cron job finished successfully.');
    } catch (error) {
      this.logger.error('Daily aggregation cron job failed:', error);
    }
  }
}