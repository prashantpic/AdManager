import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyticsRepository } from '../../storage/repositories/analytics.repository';
import { DataGranularity } from '../../common/enums/data-granularity.enum';
import { AnalyticsConfig } from '../../config/analytics.config'; // Assuming config structure

/**
 * Service that implements logic for enforcing data retention policies
 * on processed and aggregated analytics data.
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);
  private analyticsConfig: AnalyticsConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly analyticsRepository: AnalyticsRepository,
  ) {
    this.analyticsConfig = this.configService.get<AnalyticsConfig>('analytics');
    if (!this.analyticsConfig) {
        this.logger.error('Analytics configuration not found. Data retention may not work correctly.');
        // Initialize with defaults or throw error
        this.analyticsConfig = {
            raw_data_retention_months: 6, // Default example
            aggregated_data_retention_years: 2, // Default example
            sqs_ingestion_queue_url: '',
            default_attribution_model: DataGranularity.DAILY as any, // Placeholder
            dashboard_data_freshness_minutes: 60,
            internal_operational_dashboard_roles: []
        };
    }
  }

  /**
   * Applies retention policies to all relevant data types.
   * @returns A summary of deleted records.
   */
  async applyRetentionPolicies(): Promise<{
    processedEventsDeleted: number;
    aggregatedMetricsDeleted: Record<DataGranularity, number>;
  }> {
    this.logger.log('Applying data retention policies...');
    let processedEventsDeleted = 0;
    const aggregatedMetricsDeleted: Record<DataGranularity, number> = {
        [DataGranularity.HOURLY]: 0,
        [DataGranularity.DAILY]: 0,
        [DataGranularity.RAW_EVENT]: 0, // RAW_EVENT typically not aggregated this way, but for completeness
    };

    // Delete old processed events
    if (this.analyticsConfig.raw_data_retention_months > 0) {
      const processedCutoffDate = new Date();
      processedCutoffDate.setMonth(processedCutoffDate.getMonth() - this.analyticsConfig.raw_data_retention_months);
      this.logger.log(`Deleting processed events older than ${processedCutoffDate.toISOString()}`);
      try {
        processedEventsDeleted = await this.analyticsRepository.deleteProcessedEventsOlderThan(processedCutoffDate);
        this.logger.log(`Deleted ${processedEventsDeleted} old processed events.`);
      } catch (error) {
        this.logger.error(`Error deleting old processed events: ${error.message}`, error.stack);
      }
    } else {
        this.logger.log('Raw data retention is not configured or set to indefinite. Skipping deletion of processed events.');
    }


    // Delete old aggregated metrics
    if (this.analyticsConfig.aggregated_data_retention_years > 0) {
      const aggregatedCutoffDate = new Date();
      aggregatedCutoffDate.setFullYear(aggregatedCutoffDate.getFullYear() - this.analyticsConfig.aggregated_data_retention_years);
      this.logger.log(`Deleting aggregated metrics older than ${aggregatedCutoffDate.toISOString()}`);

      // Loop through granularities if policies differ, or apply generally
      // For simplicity, assuming one retention period for all aggregated data.
      // If granularity-specific retention is needed, config and logic must adapt.
      
      // Example for HOURLY (could be repeated for DAILY, etc., if needed)
      try {
        // Note: The repository method `deleteAggregatedMetricsOlderThan` needs a granularity parameter
        // Here we assume it deletes for *all* granularities older than the date.
        // Or we call it per granularity if the config is per granularity.
        // For this example, let's assume we call for each relevant granularity.
        
        const hourlyDeleted = await this.analyticsRepository.deleteAggregatedMetricsOlderThan(aggregatedCutoffDate, DataGranularity.HOURLY);
        aggregatedMetricsDeleted[DataGranularity.HOURLY] = hourlyDeleted;
        this.logger.log(`Deleted ${hourlyDeleted} old HOURLY aggregated metrics.`);

        const dailyDeleted = await this.analyticsRepository.deleteAggregatedMetricsOlderThan(aggregatedCutoffDate, DataGranularity.DAILY);
        aggregatedMetricsDeleted[DataGranularity.DAILY] = dailyDeleted;
        this.logger.log(`Deleted ${dailyDeleted} old DAILY aggregated metrics.`);

      } catch (error) {
        this.logger.error(`Error deleting old aggregated metrics: ${error.message}`, error.stack);
      }
    } else {
         this.logger.log('Aggregated data retention is not configured or set to indefinite. Skipping deletion of aggregated metrics.');
    }


    this.logger.log('Data retention policies applied.');
    return { processedEventsDeleted, aggregatedMetricsDeleted };
  }
}