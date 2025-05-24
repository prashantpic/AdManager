import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { LineItemTypeOrmEntity } from './line-item.typeorm-entity';
import { CustomerInformationTypeOrmEmbeddable } from '../embeddables/customer-information.typeorm-embeddable';
import { ShippingInformationTypeOrmEmbeddable } from '../embeddables/shipping-information.typeorm-embeddable';
import { GiftOptionTypeOrmEmbeddable } from '../embeddables/gift-option.typeorm-embeddable';
import { AppliedPromotionTypeOrmEmbeddable } from '../embeddables/applied-promotion.typeorm-embeddable'; // For JSON structure definition

/**
 * TypeORM entity for persisting order data.
 * Maps the OrderAggregate to the 'orders' table in the database.
 */
@Entity('orders')
export class OrderTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id', type: 'uuid' })
  merchantId: string;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string;

  @OneToMany(() => LineItemTypeOrmEntity, item => item.order, { cascade: true, eager: true })
  lineItems: LineItemTypeOrmEntity[];

  @Column(() => CustomerInformationTypeOrmEmbeddable, { prefix: 'cust' }) // Prefix to avoid clashes
  customerInformation: CustomerInformationTypeOrmEmbeddable;

  @Column(() => ShippingInformationTypeOrmEmbeddable, { prefix: 'ship' }) // Prefix to avoid clashes
  shippingInformation: ShippingInformationTypeOrmEmbeddable;

  @Column('jsonb', { name: 'applied_promotions', nullable: true })
  appliedPromotions?: AppliedPromotionTypeOrmEmbeddable[]; // Array of structured promotion data

  @Column(() => GiftOptionTypeOrmEmbeddable, { prefix: 'order_gift', nullable: true })
  giftOption?: GiftOptionTypeOrmEmbeddable;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ length: 3 }) // e.g., 'USD'
  currency: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}