import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * Entity representing a processed analytics event, stored in PostgreSQL before aggregation.
 */
@Entity({ name: 'processed_analytics_events' })
export class ProcessedEventEntity {
  /**
   * UUID for the processed event record.
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
   * Timestamp of the original event.
   */
  @Index()
  @Column({ type: 'timestamp with time zone' })
  eventTime: Date;

  /**
   * Timestamp when the event was processed.
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  processingTime: Date;

  /**
   * Type of the event (e.g., 'SALE', 'AD_CLICK', 'AFFILIATE_CONVERSION').
   */
  @Index()
  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  /**
   * Key-value pairs of descriptive attributes (e.g., campaign_id, product_id, country).
   */
  @Column({ type: 'jsonb' })
  dimensions: Record<string, string | number | boolean>;

  /**
   * Key-value pairs of quantitative measures (e.g., revenue, cost, quantity).
   */
  @Column({ type: 'jsonb' })
  metrics: Record<string, number>;
}