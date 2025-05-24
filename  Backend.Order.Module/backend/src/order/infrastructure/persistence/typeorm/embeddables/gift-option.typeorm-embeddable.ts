import { Column, Embeddable } from 'typeorm';

@Embeddable()
export class GiftOptionTypeOrmEmbeddable {
  @Column({ default: false, name: 'is_gift' })
  isGift: boolean;

  @Column({ nullable: true, type: 'text' })
  message?: string;

  @Column({ nullable: true, name: 'recipient_name' })
  recipientName?: string;
}