import { Column, Embeddable } from 'typeorm';

@Embeddable()
export class AppliedPromotionTypeOrmEmbeddable {
  @Column({ name: 'promotion_id' })
  promotionId: string;

  @Column({ nullable: true })
  code?: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discountAmount: number;
}