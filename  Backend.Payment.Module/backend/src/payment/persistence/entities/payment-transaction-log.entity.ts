import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { GatewayIdentifier, PaymentStatus, TransactionType } from '../../constants/payment.constants';

@Entity('payment_transaction_logs')
@Index(['merchantId', 'createdAt'])
@Index(['orderId'])
@Index(['gatewaySubscriptionId', 'createdAt'])
@Index(['gatewayTransactionId', 'gatewayIdentifier'], { unique: true, where: "gatewayTransactionId IS NOT NULL" }) // Unique for actual gateway transaction IDs
export class PaymentTransactionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  merchantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  orderId?: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  gatewaySubscriptionId?: string;

  @Column({ type: 'varchar', nullable: true })
  // Not globally unique, but unique per gateway typically. Handled by composite index above.
  gatewayTransactionId?: string;

  @Column({ type: 'enum', enum: GatewayIdentifier })
  gatewayIdentifier: GatewayIdentifier;

  @Column({ type: 'decimal', precision: 12, scale: 2 }) // Increased precision
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  @Index()
  status: PaymentStatus;

  @Column({ type: 'enum', enum: TransactionType })
  @Index()
  transactionType: TransactionType;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse?: any; // Non-sensitive gateway response details

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}