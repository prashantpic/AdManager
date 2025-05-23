import { Product } from '../../domain/product/product.entity';
import { CatalogProductItem } from '../../domain/catalog/catalog-product-item.entity';
import { CatalogProductDto } from '../dtos/catalog-product.dto';

/**
 * @namespace AdManager.Platform.Backend.ProductCatalog.Application.Mappers
 * Mapper for Product entity (catalog context) and DTO.
 * Decouples DTO transformation logic for product data within the catalog context.
 * Transforms Product domain entities to CatalogProductDto objects,
 * applying any catalog-specific overrides from CatalogProductItem.
 */
export class ProductMapper {
  /**
   * Maps a Product entity and optional CatalogProductItem overrides to a CatalogProductDto.
   * @param {Product} entity - The Product entity.
   * @param {CatalogProductItem} [itemOverrides] - Optional catalog-specific overrides.
   * @returns {CatalogProductDto} The mapped CatalogProductDto.
   */
  public static toCatalogProductDto(
    entity: Product,
    itemOverrides?: CatalogProductItem,
  ): CatalogProductDto {
    const dto: CatalogProductDto = {
      id: entity.id,
      title: itemOverrides?.customTitle ?? entity.title,
      description: itemOverrides?.customDescription ?? entity.description,
      price: entity.price,
      currency: entity.currency,
      availability: entity.availability,
      imageUrl: entity.imageUrl,
      productUrl: entity.productUrl,
      brand: entity.brand,
      gtin: entity.gtin,
      mpn: entity.mpn,
      category: entity.category,
      stockLevel: entity.stockLevel,
      customTitle: itemOverrides?.customTitle,
      customDescription: itemOverrides?.customDescription,
    };
    return dto;
  }

  /**
   * Maps a list of Product entities and an optional map of overrides to a list of CatalogProductDto objects.
   * @param {Product[]} entities - The list of Product entities.
   * @param {Map<string, CatalogProductItem>} [itemOverridesMap] - Optional map of productId to CatalogProductItem overrides.
   * @returns {CatalogProductDto[]} The list of mapped CatalogProductDto objects.
   */
  public static toCatalogProductDtoList(
    entities: Product[],
    itemOverridesMap?: Map<string, CatalogProductItem>,
  ): CatalogProductDto[] {
    return entities.map((entity) =>
      this.toCatalogProductDto(entity, itemOverridesMap?.get(entity.id)),
    );
  }
}