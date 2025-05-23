import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { DataGranularity } from '../../common/enums/data-granularity.enum';

/**
 * Entity for storing time-aggregated analytics metrics,
 * used for efficient reporting and dashboard data retrieval.
 */
@Entity({ name: 'aggregated_analytics_metrics' })
export class AggregatedMetricEntity {
  /**
   * UUID for the aggregated record.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Identifier for the merchant.
   */
  @Index()
  @Column({ type: 'uuid' }) // Assuming merchantId is a UUID
  merchantId: string;

  /**
   * Start timestamp of the aggregation period.
   */
  @Index()
  @Column({ type: 'timestamp with time zone' })
  periodStart: Date;

  /**
   * Aggregation granularity (e.g., HOURLY, DAILY).
   */
  @Index()
  @Column({
    type: 'enum',
    enum: DataGranularity,
  })
  granularity: DataGranularity;

  /**
   * Name of the aggregated metric (e.g., 'total_sales', 'total_clicks').
   */
  @Index()
  @Column({ type: 'varchar', length: 100 })
  metricName: string;

  /**
   * The aggregated value of the metric.
   */
  @Column({ type: 'double precision' }) // Using double precision for numeric metric values
  metricValue: number;

  /**
   * Key-value pairs of dimensions by which the metric is grouped (e.g., campaign_id, product_category).
   */
  @Column({ type: 'jsonb' })
  dimensions: Record<string, string | number | boolean>;
}