import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataRetentionService } from '../services/data-retention.service';

/**
 * Contains scheduled tasks (cron jobs) for triggering periodic
 * data cleanup based on defined retention policies.
 */
@Injectable()
export class DataCleanupScheduler {
  private readonly logger = new Logger(DataCleanupScheduler.name);

  constructor(private readonly dataRetentionService: DataRetentionService) {}

  /**
   * Scheduled job to run daily data cleanup.
   * Runs at 3 AM server time daily.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDataCleanupCron(): Promise<void> {
    this.logger.log('Data cleanup cron job started.');
    try {
      const result = await this.dataRetentionService.applyRetentionPolicies();
      this.logger.log(
        `Data cleanup cron job finished successfully. Processed events deleted: ${result.processedEventsDeleted}. Aggregated metrics deleted: Hourly=${result.aggregatedMetricsDeleted[DataGranularity.HOURLY]}, Daily=${result.aggregatedMetricsDeleted[DataGranularity.DAILY]}.`,
      );
    } catch (error) {
      this.logger.error('Data cleanup cron job failed:', error.stack);
    }
  }
}
// Need to import DataGranularity if used in logger string like above
import { DataGranularity } from '../../common/enums/data-granularity.enum';