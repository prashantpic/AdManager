import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AppEntity } from '../../app/entities/app.entity';
import { ReviewContent } from '../value-objects/review-content.vo';

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('app_ratings_reviews')
@Index(['appId', 'merchantId'], { unique: true }) // A merchant can review an app only once
export class AppRatingReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AppEntity, (app) => app.ratingsAndReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @Column({ type: 'uuid', comment: 'References merchant user ID' })
  merchantId: string;

  // Rating is part of ReviewContent VO, but often useful to have as a direct column for querying/aggregation
  @Column({ type: 'smallint' })
  rating: number; // 1-5

  @Column({ type: 'jsonb' })
  reviewContent: ReviewContent; // Embed ReviewContent VO (which also includes rating)

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING,
  })
  moderationStatus: ModerationStatus;

  @Column({ type: 'uuid', nullable: true, comment: 'ID of the admin/moderator user' })
  moderatedByUserId?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  moderatedAt?: Date | null;

  @Column({type: 'text', nullable: true})
  moderationComments?: string | null; // Comments from moderator if rejected

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}