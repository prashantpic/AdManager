import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2'; // Using xmlbuilder2 for XML construction
import { IFeedGenerator } from '../../../../domain/common/interfaces/feed-generator.interface';
import { FeedFormat } from '../../../../domain/common/enums/feed-format.enum';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
import { Product } from '../../../../domain/product/product.entity';
import { CatalogProductItem } from '../../../../domain/catalog/catalog-product-item.entity';
import { ProductMapper } from '../../../application/mappers/product.mapper'; // Assuming path
import { CatalogProductDto } from '../../../application/dtos/catalog-product.dto'; // Assuming path

export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.FeedGeneration {
  /**
   * XML feed generator implementation.
   * Implements IFeedGenerator for creating generic XML product feeds.
   * Uses 'xmlbuilder2'.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class XmlFeedGenerator implements IFeedGenerator {
     constructor(private readonly productMapper: ProductMapper) {}

    supports(format: FeedFormat): boolean {
      return format === FeedFormat.XML;
    }

    async generate(
      catalog: Catalog,
      products: Product[],
      productItemsMap: Map<string, CatalogProductItem>
    ): Promise<string> {
      const productDtos: CatalogProductDto[] = products.map(product =>
        this.productMapper.toCatalogProductDto(product, productItemsMap.get(product.id))
      );

      const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('items');

      for (const dto of productDtos) {
        const item = root.ele('item');
        item.ele('id').txt(dto.id);
        if (dto.title) item.ele('title').txt(dto.title);
        if (dto.description) item.ele('description').CDATA(dto.description); // Use CDATA for descriptions
        if (dto.price !== undefined && dto.currency) item.ele('price').txt(`${dto.price} ${dto.currency}`);
        if (dto.availability) item.ele('availability').txt(dto.availability);
        if (dto.imageUrl) item.ele('image_url').txt(dto.imageUrl);
        if (dto.productUrl) item.ele('product_url').txt(dto.productUrl);
        if (dto.brand) item.ele('brand').txt(dto.brand);
        if (dto.gtin) item.ele('gtin').txt(dto.gtin);
        if (dto.mpn) item.ele('mpn').txt(dto.mpn);
        if (dto.category) item.ele('category').txt(dto.category);
        if (dto.stockLevel !== undefined) item.ele('stock_level').txt(String(dto.stockLevel));
        // Add other DTO fields as XML elements
      }

      return root.end({ prettyPrint: true });
    }
  }
}