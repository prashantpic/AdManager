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
   * Google Merchant Center feed generator implementation.
   * Formats product data according to Google Merchant Center's XML schema.
   * Uses 'xmlbuilder2'.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class GoogleMerchantFeedGenerator implements IFeedGenerator {
    constructor(private readonly productMapper: ProductMapper) {}

    supports(format: FeedFormat): boolean {
      return format === FeedFormat.GOOGLE_MERCHANT_CENTER;
    }

    async generate(
      catalog: Catalog,
      products: Product[],
      productItemsMap: Map<string, CatalogProductItem>
    ): Promise<string> {
      const productDtos: CatalogProductDto[] = products.map(product =>
        this.productMapper.toCatalogProductDto(product, productItemsMap.get(product.id))
      );

      const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('rss', {
          version: '2.0',
          'xmlns:g': 'http://base.google.com/ns/1.0',
        })
        .ele('channel');

      // Basic channel info - can be enhanced with catalog details
      root.ele('title').txt(catalog.name || 'Product Feed');
      root.ele('link').txt('YOUR_MERCHANT_WEBSITE_URL'); // This should be configurable or from merchant settings
      root.ele('description').txt(catalog.description || 'Product catalog feed.');

      for (const dto of productDtos) {
        const item = root.ele('item');
        item.ele('g:id').txt(dto.id);
        if (dto.title) item.ele('g:title').txt(dto.title);
        if (dto.description) item.ele('g:description').CDATA(dto.description); // Use CDATA
        if (dto.productUrl) item.ele('g:link').txt(dto.productUrl);
        if (dto.imageUrl) item.ele('g:image_link').txt(dto.imageUrl);
        if (dto.availability) item.ele('g:availability').txt(dto.availability); // e.g., 'in stock', 'out of stock'
        if (dto.price !== undefined && dto.currency) {
          item.ele('g:price').txt(`${dto.price.toFixed(2)} ${dto.currency}`);
        }
        if (dto.brand) item.ele('g:brand').txt(dto.brand);
        if (dto.gtin) item.ele('g:gtin').txt(dto.gtin);
        if (dto.mpn) item.ele('g:mpn').txt(dto.mpn);
        // 'identifier_exists' might be needed if gtin/mpn are missing for some items
        // item.ele('g:identifier_exists').txt(dto.gtin || dto.mpn ? 'yes' : 'no');
        if (dto.category) item.ele('g:google_product_category').txt(dto.category);
        // Add other Google specific fields like condition, shipping, tax, custom_labels etc.
        // e.g. item.ele('g:condition').txt('new');
        if (dto.stockLevel !== undefined && dto.availability === 'in stock') {
            // Not a standard GMC field directly, but availability covers it.
            // Some systems use custom labels for stock levels or detailed inventory.
        }
      }

      return root.end({ prettyPrint: true });
    }
  }
}