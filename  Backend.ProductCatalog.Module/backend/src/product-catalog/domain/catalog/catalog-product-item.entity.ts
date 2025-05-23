import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Catalog } from './catalog.aggregate'; // Adjusted import path

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Domain.Catalog
 * Entity for products within a specific catalog.
 * Links a product to a catalog and allows for catalog-specific overrides of product data.
 * Represents an item within a catalog, referencing a product and allowing for customized fields.
 */
@Entity('catalog_product_items')
@Index(['catalog', 'productId'], { unique: true })
export class CatalogProductItem {
  /**
   * @member {string} id - The unique identifier for the catalog product item.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @member {Catalog} catalog - The catalog this item belongs to.
   */
  @ManyToOne(() => Catalog, (catalog) => catalog.productItems, {
    onDelete: 'CASCADE',
    nullable: false, // A CatalogProductItem must belong to a Catalog
  })
  catalog: Catalog;

  /**
   * @member {string} productId - References the ID of a Product entity.
   */
  @Column()
  @Index()
  productId: string;

  /**
   * @member {string} [customTitle] - Optional catalog-specific title for the product.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  customTitle?: string;

  /**
   * @member {string} [customDescription] - Optional catalog-specific description for the product.
   */
  @Column({ type: 'text', nullable: true })
  customDescription?: string;

  /**
   * @member {Date} addedAt - Timestamp when the product was added to the catalog.
   */
  @CreateDateColumn()
  addedAt: Date;
}