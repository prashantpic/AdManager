import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppEntity } from './app.entity';
import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';

@Entity('app_versions')
export class AppVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, (app) => app.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @Column({ length: 50 })
  versionNumber: string;

  @Column('text')
  changelog: string;

  @Column({ type: 'varchar', length: 2048 })
  packageUrl: string; // URL to the app package (e.g., S3 link)

  @Column({ type: 'simple-array', nullable: true })
  platformApiVersionCompatibility: string[]; // e.g., ['1.0', '1.1']

  @Column({ type: 'timestamp with time zone', nullable: true })
  releaseDate: Date | null; // Date this version was made active/published

  @Column({
    type: 'enum',
    enum: AppReviewStatus,
    nullable: true, // May not apply if version is directly published or auto-approved
  })
  reviewStatus: AppReviewStatus | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean; // Is this the current primary version for the app?

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}