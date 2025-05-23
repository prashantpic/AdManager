import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';

// Placeholder for ProductCatalogItemDto, assuming it's defined elsewhere
// e.g., backend/src/integration/ad-networks/common/dtos/product-catalog-item.dto.ts
// For the purpose of this file, we'll define a minimal version here.
// In a real scenario, this import would point to the actual file.

export class ProductCatalogItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  price: string; // Assuming price is a string representation, e.g., "10.99"

  @IsString()
  @IsNotEmpty()
  currency: string; // e.g., "USD"

  @IsString()
  @IsNotEmpty()
  availability: string; // e.g., "in stock", "out of stock"

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  productUrl: string;

  // Other common fields like gtin, mpn, brand, etc. can be added
}


/**
 * Platform-neutral Data Transfer Object representing a product catalog
 * for synchronization with various ad networks.
 */
export class ProductCatalogDto {
  /**
   * A unique identifier for the catalog within the platform.
   */
  @IsString()
  @IsNotEmpty()
  catalogId: string;

  /**
   * An array of product items belonging to this catalog.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCatalogItemDto)
  items: ProductCatalogItemDto[];
}