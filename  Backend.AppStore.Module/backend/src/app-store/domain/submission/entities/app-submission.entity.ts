import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppEntity } from '../../app/entities/app.entity';
import { AppVersionEntity } from '../../app/entities/app-version.entity';
import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';
import { SubmissionDetails } from '../value-objects/submission-details.vo';
import { AppReviewProcessEntity } from '../../review/entities/app-review-process.entity';

@Entity('app_submissions')
export class AppSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, { nullable: true, eager: false }) // Nullable if submitting a new app
  @JoinColumn({ name: 'appId' })
  app?: AppEntity | null;

  @Column({ type: 'uuid', nullable: true })
  appId?: string | null;

  @OneToOne(() => AppVersionEntity, { eager: true, cascade: true }) // Each submission is for one specific version
  @JoinColumn({ name: 'appVersionId'})
  appVersion: AppVersionEntity;

  @Column({ type: 'uuid' })
  appVersionId: string;

  @Column({ type: 'uuid', comment: 'References developer user ID' })
  developerId: string;

  @Column({ type: 'jsonb' })
  submissionDetails: SubmissionDetails; // Embed SubmissionDetails VO

  @Column({
    type: 'enum',
    enum: AppReviewStatus,
    default: AppReviewStatus.PENDING_REVIEW,
  })
  status: AppReviewStatus;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @OneToOne(() => AppReviewProcessEntity, (reviewProcess) => reviewProcess.submission, { cascade: true, nullable: true })
  reviewProcess?: AppReviewProcessEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}