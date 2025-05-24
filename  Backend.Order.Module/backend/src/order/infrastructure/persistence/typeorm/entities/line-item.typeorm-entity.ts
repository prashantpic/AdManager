import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderTypeOrmEntity } from './order.typeorm-entity';
import { GiftOptionTypeOrmEmbeddable } from '../embeddables/gift-option.typeorm-embeddable';

@Entity('line_items')
export class LineItemTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column(() => GiftOptionTypeOrmEmbeddable, { prefix: 'item_gift', nullable: true })
  giftOption?: GiftOptionTypeOrmEmbeddable;

  @ManyToOne(() => OrderTypeOrmEntity, order => order.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderTypeOrmEntity;
}