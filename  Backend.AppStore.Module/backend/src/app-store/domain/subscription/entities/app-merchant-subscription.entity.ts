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
import { AppInstallationEntity } from '../../installation/entities/app-installation.entity';
import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE', // Payment failed
  ENDED = 'ENDED', // Gracefully ended
  PENDING_ACTIVATION = 'PENDING_ACTIVATION', // Payment initiated but not confirmed
}

@Entity('app_merchant_subscriptions')
export class AppMerchantSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => AppInstallationEntity, (installation) => installation.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'installationId' })
  installation: AppInstallationEntity;

  @Column({ type: 'uuid', unique: true }) // Each installation can have at most one active subscription
  installationId: string;

  @ManyToOne(() => AppEntity, (app) => app.merchantSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

  @Column({ type: 'uuid' })
  appId: string;

  @Column({ type: 'uuid', comment: 'References merchant user ID' })
  merchantId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING_ACTIVATION,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: AppPricingModel,
  })
  pricingModel: AppPricingModel; // Copied from AppPricing for record keeping

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Price at the time of subscription

  @Column({ length: 3 })
  currency: string; // ISO currency code

  @Column({ length: 50 }) // e.g., 'monthly', 'annual'
  billingCycle: string;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date | null; // For fixed-term subscriptions or after cancellation

  @Column({ type: 'timestamp with time zone', nullable: true })
  renewalDate?: Date | null; // Next billing date

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndDate?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'ID from external billing system (Stripe, PayPal)' })
  externalSubscriptionId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}