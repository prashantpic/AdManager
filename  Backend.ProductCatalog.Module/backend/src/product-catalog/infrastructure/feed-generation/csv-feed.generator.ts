import { Injectable } from '@nestjs/common';
import * as papaparse from 'papaparse';
import { IFeedGenerator } from '../../../../domain/common/interfaces/feed-generator.interface';
import { FeedFormat } from '../../../../domain/common/enums/feed-format.enum';
import { Catalog } from '../../../../domain/catalog/catalog.aggregate';
import { Product } from '../../../../domain/product/product.entity';
import { CatalogProductItem } from '../../../../domain/catalog/catalog-product-item.entity';
import { ProductMapper } from '../../../application/mappers/product.mapper'; // Assuming path
import { CatalogProductDto } from '../../../application/dtos/catalog-product.dto'; // Assuming path


export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.FeedGeneration {
  /**
   * CSV feed generator implementation.
   * Implements IFeedGenerator for creating CSV product feeds.
   * Uses 'papaparse' library.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class CsvFeedGenerator implements IFeedGenerator {
    constructor(private readonly productMapper: ProductMapper) {}

    supports(format: FeedFormat): boolean {
      return format === FeedFormat.CSV;
    }

    async generate(
      catalog: Catalog,
      products: Product[],
      productItemsMap: Map<string, CatalogProductItem>
    ): Promise<string> {
      const productDtos: CatalogProductDto[] = products.map(product =>
        this.productMapper.toCatalogProductDto(product, productItemsMap.get(product.id))
      );

      if (productDtos.length === 0) {
        // Return header only for empty feed or handle as error/empty string
        // Depending on platform requirements, a header might still be needed.
        // For simplicity, let's assume a specific header structure.
        // This header structure should ideally be configurable or derived from platform specs.
        const defaultHeaders = ['id', 'title', 'description', 'price', 'currency', 'availability', 'image_link', 'link', 'brand', 'gtin', 'mpn', 'google_product_category', 'stock_level'];
        return papaparse.unparse([defaultHeaders], { header: false });
      }
      
      // Papaparse will automatically use the keys of the first object as headers if not specified.
      // Ensure all DTOs have consistent keys for proper CSV generation.
      // It's good practice to explicitly define headers to ensure order and inclusion of all fields.
      const dataToParse = productDtos.map(dto => ({
        id: dto.id,
        title: dto.title,
        description: dto.description,
        price: `${dto.price} ${dto.currency}`, // Common format for price, e.g. "10.99 USD"
        availability: dto.availability,
        image_link: dto.imageUrl, // Google specific field name example
        link: dto.productUrl,     // Google specific field name example
        brand: dto.brand,
        gtin: dto.gtin,
        mpn: dto.mpn,
        google_product_category: dto.category, // Google specific field name example
        stock_level: dto.stockLevel,
        // Add other DTO fields as needed, mapping to specific CSV column names
      }));

      // Explicitly define headers based on expected output for consistency
      const headers = Object.keys(dataToParse[0]);


      return papaparse.unparse(dataToParse, {
        header: true, // Use the keys from the objects as headers
        quotes: true, // Enclose fields in quotes
        delimiter: ',',
        newline: '\r\n',
        // columns: headers // To enforce column order and presence
      });
    }
  }
}