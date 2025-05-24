import { Column, Embeddable } from 'typeorm';
import { ShippingAddressTypeOrmEmbeddable } from './shipping-address.typeorm-embeddable';

@Embeddable()
export class ShippingInformationTypeOrmEmbeddable {
  @Column(() => ShippingAddressTypeOrmEmbeddable)
  address: ShippingAddressTypeOrmEmbeddable;

  @Column()
  method: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;
}