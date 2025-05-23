```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Domain.Product
// ComponentId: product-repository-001
// Summary: Product domain entity for catalog context.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-004, REQ-PCM-010
// Purpose: Defines the structure of product data used within the Product Catalog bounded context for generating feeds and applying rules.
// LogicDescription: Stores product information necessary for generating various feed formats. This entity might be populated via an integration with a merchant's e-commerce platform or a master Product module. It's tailored for the needs of product catalog generation.

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Comment,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryColumn()
  @Comment("This ID should match the merchant's product ID from their system")
  id: string;

  @Column()
  @Index()
  merchantId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3 })
  currency: string;

  @Column()
  @Comment('e.g., in stock, out of stock, preorder')
  availability: string; // Consider using an enum if values are well-defined

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'text' })
  productUrl: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  gtin?: string;

  @Column({ nullable: true })
  mpn?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'integer', default: 0 })
  stockLevel: number;

  @Column({ nullable: true })
  @Comment('Timestamp of last update from merchant system')
  sourceUpdatedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```