import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between, In, Raw } from 'typeorm';
import { ProcessedEventEntity } from '../entities/processed-event.entity';
import { AggregatedMetricEntity } from '../entities/aggregated-metric.entity';
import { DateRangeDto } from '../../common/dtos/date-range.dto';
import { DataGranularity } from '../../common/enums/data-granularity.enum';

/**
 * Repository for CRUD operations and querying of processed and aggregated analytics data stored in PostgreSQL.
 */
@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(
    @InjectRepository(ProcessedEventEntity)
    private readonly processedEventRepository: Repository<ProcessedEventEntity>,
    @InjectRepository(AggregatedMetricEntity)
    private readonly aggregatedMetricRepository: Repository<AggregatedMetricEntity>,
  ) {}

  /**
   * Saves multiple processed events.
   * @param events - An array of ProcessedEventEntity to save.
   * @returns A promise resolving to the saved processed event entities.
   */
  async saveProcessedEvents(
    events: ProcessedEventEntity[],
  ): Promise<ProcessedEventEntity[]> {
    if (!events || events.length === 0) {
      return [];
    }
    this.logger.log(`Saving ${events.length} processed events.`);
    try {
      return await this.processedEventRepository.save(events);
    } catch (error) {
      this.logger.error(`Error saving processed events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Finds processed events based on criteria, used by aggregator.
   * @param criteria - The criteria to filter processed events.
   * @returns A promise resolving to an array of processed event entities.
   */
  async findProcessedEvents(criteria: {
    merchantId: string;
    dateRange: DateRangeDto;
    eventTypes?: string[];
    dimensionsFilter?: Record<string, any>;
  }): Promise<ProcessedEventEntity[]> {
    this.logger.log(
      `Finding processed events for merchant ${criteria.merchantId}`,
    );
    const queryBuilder = this.processedEventRepository.createQueryBuilder('event');
    queryBuilder.where('event.merchantId = :merchantId', {
      merchantId: criteria.merchantId,
    });
    queryBuilder.andWhere('event.eventTime BETWEEN :startDate AND :endDate', {
      startDate: criteria.dateRange.startDate,
      endDate: criteria.dateRange.endDate,
    });

    if (criteria.eventTypes && criteria.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: criteria.eventTypes,
      });
    }

    if (criteria.dimensionsFilter) {
      Object.entries(criteria.dimensionsFilter).forEach(([key, value]) => {
        // For JSONB, a simple equality check on a top-level key:
        // queryBuilder.andWhere(`event.dimensions ->> :dimKey = :dimValue`, { dimKey: key, dimValue: value });
        // For more complex JSONB queries (e.g., nested, contains), use Raw or specific TypeORM features
         queryBuilder.andWhere(`event.dimensions @> :dimFilter`, { dimFilter: JSON.stringify({[key]: value}) });
      });
    }
    // Add ordering for consistency if needed, e.g. by eventTime
    queryBuilder.orderBy('event.eventTime', 'ASC');

    try {
      return await queryBuilder.getMany();
    } catch (error) {
        this.logger.error(`Error finding processed events: ${error.message}`, error.stack);
        throw error;
    }
  }

  /**
   * Saves multiple aggregated metrics.
   * @param metrics - An array of AggregatedMetricEntity to save.
   * @returns A promise resolving to the saved aggregated metric entities.
   */
  async saveAggregatedMetrics(
    metrics: AggregatedMetricEntity[],
  ): Promise<AggregatedMetricEntity[]> {
    if (!metrics || metrics.length === 0) {
      return [];
    }
    this.logger.log(`Saving ${metrics.length} aggregated metrics.`);
     try {
      return await this.aggregatedMetricRepository.save(metrics);
    } catch (error) {
      this.logger.error(`Error saving aggregated metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Finds aggregated metrics based on criteria, used by reporting services.
   * @param criteria - The criteria to filter aggregated metrics.
   * @returns A promise resolving to an array of aggregated metric entities.
   */
  async findAggregatedMetrics(criteria: {
    merchantId?: string; // Optional for platform-wide internal metrics
    dateRange: DateRangeDto;
    granularity: DataGranularity;
    metricNames?: string[];
    dimensionsFilter?: Record<string, any>;
  }): Promise<AggregatedMetricEntity[]> {
    this.logger.log(
      `Finding aggregated metrics for granularity ${criteria.granularity}, merchant ${criteria.merchantId || 'platform-wide'}`,
    );
    const queryBuilder = this.aggregatedMetricRepository.createQueryBuilder('metric');

    if (criteria.merchantId) {
        queryBuilder.where('metric.merchantId = :merchantId', {
          merchantId: criteria.merchantId,
        });
        queryBuilder.andWhere('metric.periodStart BETWEEN :startDate AND :endDate', {
            startDate: criteria.dateRange.startDate,
            endDate: criteria.dateRange.endDate,
          });
    } else { // For platform-wide metrics, only filter by date range
        queryBuilder.where('metric.periodStart BETWEEN :startDate AND :endDate', {
            startDate: criteria.dateRange.startDate,
            endDate: criteria.dateRange.endDate,
          });
    }


    queryBuilder.andWhere('metric.granularity = :granularity', {
      granularity: criteria.granularity,
    });

    if (criteria.metricNames && criteria.metricNames.length > 0) {
      queryBuilder.andWhere('metric.metricName IN (:...metricNames)', {
        metricNames: criteria.metricNames,
      });
    }

    if (criteria.dimensionsFilter) {
      Object.entries(criteria.dimensionsFilter).forEach(([key, value]) => {
        // queryBuilder.andWhere(`metric.dimensions ->> :dimKey = :dimValue`, { dimKey: key, dimValue: value });
         queryBuilder.andWhere(`metric.dimensions @> :dimFilter`, { dimFilter: JSON.stringify({[key]: value}) });
      });
    }
    queryBuilder.orderBy('metric.periodStart', 'ASC').addOrderBy('metric.metricName', 'ASC');

    try {
        return await queryBuilder.getMany();
    } catch (error) {
        this.logger.error(`Error finding aggregated metrics: ${error.message}`, error.stack);
        throw error;
    }
  }

  /**
   * Deletes processed events older than a specified date.
   * @param date - The cutoff date. Events older than this will be deleted.
   * @param merchantId - Optional merchant ID to scope deletion.
   * @returns A promise resolving to the number of deleted records.
   */
  async deleteProcessedEventsOlderThan(
    date: Date,
    merchantId?: string,
  ): Promise<number> {
    this.logger.log(
      `Deleting processed events older than ${date.toISOString()}` +
        (merchantId ? ` for merchant ${merchantId}` : ''),
    );
    const qb = this.processedEventRepository.createQueryBuilder()
      .delete()
      .from(ProcessedEventEntity)
      .where('eventTime < :date', { date });

    if (merchantId) {
      qb.andWhere('merchantId = :merchantId', { merchantId });
    }
    
    try {
        const result = await qb.execute();
        const affectedCount = result.affected || 0;
        this.logger.log(`Deleted ${affectedCount} processed events.`);
        return affectedCount;
    } catch (error) {
        this.logger.error(`Error deleting old processed events: ${error.message}`, error.stack);
        throw error;
    }
  }

  /**
   * Deletes aggregated metrics older than a specified date for a given granularity.
   * @param date - The cutoff date. Metrics older than this will be deleted.
   * @param granularity - The granularity of the metrics to delete.
   * @param merchantId - Optional merchant ID to scope deletion.
   * @returns A promise resolving to the number of deleted records.
   */
  async deleteAggregatedMetricsOlderThan(
    date: Date,
    granularity: DataGranularity,
    merchantId?: string,
  ): Promise<number> {
    this.logger.log(
      `Deleting aggregated metrics for granularity ${granularity} older than ${date.toISOString()}` +
        (merchantId ? ` for merchant ${merchantId}` : ''),
    );
    
    const qb = this.aggregatedMetricRepository.createQueryBuilder()
      .delete()
      .from(AggregatedMetricEntity)
      .where('periodStart < :date', { date })
      .andWhere('granularity = :granularity', { granularity });

    if (merchantId) {
      qb.andWhere('merchantId = :merchantId', { merchantId });
    }

    try {
        const result = await qb.execute();
        const affectedCount = result.affected || 0;
        this.logger.log(`Deleted ${affectedCount} aggregated metrics for granularity ${granularity}.`);
        return affectedCount;
    } catch (error) {
        this.logger.error(`Error deleting old aggregated metrics: ${error.message}`, error.stack);
        throw error;
    }
  }
}