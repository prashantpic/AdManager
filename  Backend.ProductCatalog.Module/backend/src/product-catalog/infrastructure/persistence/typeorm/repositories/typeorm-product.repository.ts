import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../../../../domain/product/product.entity';
import { IProductRepository } from '../../../../domain/product/interfaces/product.repository.interface';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
import { CatalogProductItem } from '../../../../domain/catalog/catalog-product-item.entity';

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Persistence.TypeOrm {
  /**
   * TypeORM repository for Products (catalog context).
   * Handles database operations for Product entities using TypeORM and PostgreSQL.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class TypeOrmProductRepository implements IProductRepository {
    constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
      @InjectRepository(CatalogProductItem) // Needed for findProductsForCatalog
      private readonly catalogProductItemRepository: Repository<CatalogProductItem>,
    ) {}

    async findByIdsAndMerchantId(
      productIds: string[],
      merchantId: string,
    ): Promise<Product[]> {
      if (!productIds || productIds.length === 0) {
        return [];
      }
      return this.productRepository.find({
        where: {
          id: In(productIds),
          merchantId,
        },
      });
    }

    async findAllByMerchantId(merchantId: string): Promise<Product[]> {
      return this.productRepository.find({
        where: { merchantId },
        order: { createdAt: 'DESC'}
      });
    }

    /**
     * Retrieves products associated with a specific catalog.
     * It fetches Product entities based on the productIds stored in CatalogProductItem
     * for the given catalogId.
     */
    async findProductsForCatalog(catalogId: string, merchantId: string): Promise<Product[]> {
      // First, get all product IDs associated with the catalog
      const catalogProductItems = await this.catalogProductItemRepository.find({
        where: { catalog: { id: catalogId, merchantId } }, // Ensure merchant owns catalog
        select: ['productId'],
      });

      if (!catalogProductItems || catalogProductItems.length === 0) {
        return [];
      }

      const productIds = catalogProductItems.map(item => item.productId);
      
      // Then, fetch the actual product details for these IDs, ensuring they belong to the merchant
      return this.productRepository.find({
        where: {
          id: In(productIds),
          merchantId: merchantId, // Double-check merchant ownership of products
        },
      });
    }
    
    async findProductIdsForCatalog(catalogId: string, merchantId: string): Promise<string[]> {
         const catalogProductItems = await this.catalogProductItemRepository.find({
            where: { catalog: { id: catalogId, merchantId } },
            select: ['productId'],
        });
        return catalogProductItems.map(item => item.productId);
    }


    async save(product: Product): Promise<Product> {
      return this.productRepository.save(product);
    }

    async saveMany(products: Product[]): Promise<Product[]> {
      // TypeORM's save can handle an array of entities.
      // This is efficient for bulk inserts/updates.
      return this.productRepository.save(products);
    }

     async findByMerchantIdAndProductIds(merchantId: string, productIds: string[]): Promise<Product[]> {
        if (productIds.length === 0) return [];
        return this.productRepository.find({
            where: {
                merchantId,
                id: In(productIds),
            },
        });
    }
  }
}