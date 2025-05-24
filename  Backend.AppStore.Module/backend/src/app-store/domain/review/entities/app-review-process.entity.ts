import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppSubmissionEntity } from '../../submission/entities/app-submission.entity';
import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';
import { ReviewFeedback } from '../value-objects/review-feedback.vo';

@Entity('app_review_processes')
export class AppReviewProcessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => AppSubmissionEntity, (submission) => submission.reviewProcess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: AppSubmissionEntity;

  @Column({ type: 'uuid', unique: true }) // Each submission has one review process
  submissionId: string;

  @Column({
    type: 'enum',
    enum: AppReviewStatus,
    default: AppReviewStatus.PENDING_REVIEW,
  })
  status: AppReviewStatus;

  @Column({ type: 'uuid', nullable: true, comment: 'ID of the admin/reviewer user' })
  assignedToUserId?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  feedback?: ReviewFeedback | null; // Embed ReviewFeedback VO

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string | null; // Internal notes for reviewers

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}