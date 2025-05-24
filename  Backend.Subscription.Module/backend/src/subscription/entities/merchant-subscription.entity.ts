import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';

@Entity('merchant_subscriptions')
export class MerchantSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
  endDate: Date | null;

  @Column({ name: 'current_period_start', type: 'timestamp with time zone' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp with time zone' })
  currentPeriodEnd: Date;

  @Column({ type: 'jsonb', name: 'billing_info', nullable: true })
  billingInfoJson: string | null; // Stores BillingDetailsVO as JSON string

  @Column({ type: 'jsonb', name: 'payment_history', default: '[]' })
  paymentHistoryJson: string; // Stores PaymentRecordVO[] as JSON string

  @Column({ name: 'dunning_attempts', default: 0 })
  dunningAttempts: number;

  @Column({ name: 'last_payment_attempt', type: 'timestamp with time zone', nullable: true })
  lastPaymentAttempt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}