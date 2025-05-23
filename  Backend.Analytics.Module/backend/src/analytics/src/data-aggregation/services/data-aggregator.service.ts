import { Injectable, Logger } from '@nestjs/common';
import { DataGranularity } from '../../common/enums/data-granularity.enum';
import { AnalyticsRepository } from '../../storage/repositories/analytics.repository';
import { ProcessedEventEntity } from '../../storage/entities/processed-event.entity';
import { AggregatedMetricEntity } from '../../storage/entities/aggregated-metric.entity';
import { MoreThanOrEqual, LessThan, Between } from 'typeorm';

/**
 * Core service for aggregating processed event data into hourly and daily summaries.
 */
@Injectable()
export class DataAggregatorService {
  private readonly logger = new Logger(DataAggregatorService.name);

  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  /**
   * Aggregates data for a given period, granularity, and optionally a specific merchant.
   * This is a complex method; the implementation below is a simplified concept.
   * Real aggregation might involve more sophisticated SQL queries or data manipulation.
   * @param startDate The start date of the period.
   * @param endDate The end date of the period (exclusive).
   * @param granularity The granularity to aggregate at.
   * @param merchantId Optional merchant ID to filter by.
   */
  async aggregateDataForPeriod(
    startDate: Date,
    endDate: Date,
    granularity: DataGranularity,
    merchantId?: string,
  ): Promise<void> {
    this.logger.log(
      `Starting aggregation for period: ${startDate.toISOString()} - ${endDate.toISOString()}, granularity: ${granularity}, merchant: ${merchantId || 'all'}`,
    );

    if (granularity === DataGranularity.RAW_EVENT) {
        this.logger.warn('Aggregation called with RAW_EVENT granularity. No aggregation will be performed.');
        return;
    }

    const criteria: any = {
        dateRange: { startDate, endDate },
    };
    if (merchantId) {
        criteria.merchantId = merchantId;
    }

    // Fetch processed events for the period
    // In a real-world scenario, for large datasets, you'd process in chunks or use DB-level aggregation.
    const processedEvents = await this.analyticsRepository.findProcessedEvents(criteria);

    if (!processedEvents || processedEvents.length === 0) {
      this.logger.log('No processed events found for the given period and criteria.');
      return;
    }

    // This is a very simplified in-memory aggregation logic.
    // For performance, this should ideally be done at the database level (e.g., GROUP BY queries)
    // or using a stream processing approach for very large datasets.
    const aggregatedMetricsMap = new Map<string, AggregatedMetricEntity>();

    for (const event of processedEvents) {
      const periodStart = this.getPeriodStart(event.eventTime, granularity);

      // Iterate over metrics within the event's metrics JSONB
      for (const metricName in event.metrics) {
        if (Object.prototype.hasOwnProperty.call(event.metrics, metricName)) {
          const metricValue = Number(event.metrics[metricName]);
          if (isNaN(metricValue)) continue;

          // Create a composite key for aggregation based on period, merchant, dimensions, and metric name
          // Dimensions should be stringified consistently for the key
          const dimensionsKey = JSON.stringify(Object.entries(event.dimensions).sort());
          const key = `${periodStart.toISOString()}_${event.merchantId}_${granularity}_${metricName}_${dimensionsKey}`;

          let aggregate = aggregatedMetricsMap.get(key);
          if (!aggregate) {
            aggregate = new AggregatedMetricEntity();
            aggregate.merchantId = event.merchantId;
            aggregate.periodStart = periodStart;
            aggregate.granularity = granularity;
            aggregate.metricName = metricName; // Store individual metric names
            aggregate.metricValue = 0;
            aggregate.dimensions = event.dimensions; // Store the dimensions JSONB
            aggregatedMetricsMap.set(key, aggregate);
          }
          // Summing up metric values. For other aggregations (AVG, COUNT), logic would differ.
          aggregate.metricValue += metricValue;
        }
      }
    }

    const aggregatesToSave = Array.from(aggregatedMetricsMap.values());

    if (aggregatesToSave.length > 0) {
      // This could be a large batch, consider chunking if necessary
      await this.analyticsRepository.saveAggregatedMetrics(aggregatesToSave);
      this.logger.log(`Saved ${aggregatesToSave.length} aggregated metrics.`);
    } else {
      this.logger.log('No new aggregated metrics to save.');
    }
  }

  private getPeriodStart(date: Date, granularity: DataGranularity): Date {
    const d = new Date(date);
    if (granularity === DataGranularity.HOURLY) {
      d.setMinutes(0, 0, 0);
    } else if (granularity === DataGranularity.DAILY) {
      d.setHours(0, 0, 0, 0);
    }
    return d;
  }

  /**
   * Specific method for hourly aggregation.
   * @param targetHour The specific hour to aggregate for.
   * @param merchantId Optional merchant ID.
   */
  async triggerHourlyAggregation(targetHour: Date, merchantId?: string): Promise<void> {
    const startDate = new Date(targetHour);
    startDate.setMinutes(0, 0, 0); // Start of the target hour

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Start of the next hour

    this.logger.log(`Triggering hourly aggregation for hour starting: ${startDate.toISOString()}`);
    await this.aggregateDataForPeriod(startDate, endDate, DataGranularity.HOURLY, merchantId);
  }

  /**
   * Specific method for daily aggregation.
   * @param targetDay The specific day to aggregate for.
   * @param merchantId Optional merchant ID.
   */
  async triggerDailyAggregation(targetDay: Date, merchantId?: string): Promise<void> {
    const startDate = new Date(targetDay);
    startDate.setHours(0, 0, 0, 0); // Start of the target day

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // Start of the next day

    this.logger.log(`Triggering daily aggregation for day starting: ${startDate.toISOString()}`);
    await this.aggregateDataForPeriod(startDate, endDate, DataGranularity.DAILY, merchantId);
  }
}