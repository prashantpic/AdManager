import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ReportRequestDto } from '../../common/dtos/report-request.dto'; // For type hint

/**
 * Entity for persisting merchant-saved custom report configurations in the database.
 */
@Entity({ name: 'saved_report_configurations' })
export class ReportConfigurationEntity {
  /**
   * UUID for the saved report configuration.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Identifier of the merchant who owns this configuration.
   */
  @Index()
  @Column({ type: 'uuid' }) // Assuming merchantId is a UUID
  merchantId: string;

  /**
   * User-defined name for the configuration.
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Optional user-defined description.
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * JSON string representing the saved ReportRequestDto.
   * Stored as JSONB for querying capabilities if needed, though primarily for retrieval.
   */
  @Column({ type: 'jsonb' })
  configurationJson: ReportRequestDto; // Store the DTO structure directly

  /**
   * Timestamp when the configuration was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when the configuration was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}