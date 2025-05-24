import { Column, Embeddable } from 'typeorm';

/**
 * TypeORM embeddable entity for storing shipping address details.
 * This embeddable is typically nested within other entities like ShippingInformationTypeOrmEmbeddable.
 */
@Embeddable()
export class ShippingAddressTypeOrmEmbeddable {
  /**
   * The street address line 1.
   */
  @Column({ type: 'varchar', length: 255 })
  street: string;

  /**
   * The city name.
   */
  @Column({ type: 'varchar', length: 100 })
  city: string;

  /**
   * The state, province, or region. Optional.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  /**
   * The postal code or ZIP code.
   */
  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  /**
   * The country code (e.g., ISO 3166-1 alpha-2) or full country name.
   */
  @Column({ type: 'varchar', length: 100 })
  country: string;
}