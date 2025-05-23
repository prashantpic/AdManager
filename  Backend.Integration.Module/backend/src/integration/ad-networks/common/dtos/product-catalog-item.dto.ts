/**
 * @file product-catalog-item.dto.ts
 * @description Platform-neutral DTO for a single product catalog item before mapping to ad network specific format.
 * @namespace AdManager.Platform.Backend.Integration.AdNetworks.Common.Dtos
 */

import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

/**
 * Represents a product item consistently before transformation for specific ad networks.
 * Contains all mandatory and optional fields for a product catalog item as per platform specifications.
 * Based on REQ-PCM-004.
 * @requirement REQ-PCM-004
 * @requirement REQ-11-003
 */
export class ProductCatalogItemDto {
  /**
   * Unique identifier for the product item.
   */
  @IsString()
  @IsNotEmpty()
  public id: string;

  /**
   * Title of the product.
   */
  @IsString()
  @IsNotEmpty()
  public title: string;

  /**
   * Description of the product.
   */
  @IsOptional()
  @IsString()
  public description?: string;

  /**
   * Price of the product (e.g., "19.99 USD" or just the amount if currency is separate).
   * Consider splitting into amount and currency if more structured data is needed.
   * For simplicity, keeping as string as per definition.
   */
  @IsString()
  @IsNotEmpty()
  public price: string;

  /**
   * Currency code (e.g., "USD", "SAR").
   */
  @IsString()
  @IsNotEmpty()
  public currency: string;

  /**
   * Availability status of the product (e.g., "in stock", "out of stock", "preorder").
   */
  @IsString()
  @IsNotEmpty()
  public availability: string;

  /**
   * URL of the main image for the product.
   */
  @IsUrl()
  @IsNotEmpty()
  public imageUrl: string;

  /**
   * URL of the product page on the merchant's website.
   */
  @IsUrl()
  @IsNotEmpty()
  public productUrl: string;

  /**
   * Brand of the product.
   */
  @IsOptional()
  @IsString()
  public brand?: string;

  /**
   * Global Trade Item Number (GTIN).
   */
  @IsOptional()
  @IsString()
  public gtin?: string;

  /**
   * Manufacturer Part Number (MPN).
   */
  @IsOptional()
  @IsString()
  public mpn?: string;

  /**
   * Product category (e.g., "Apparel > Shoes > Sneakers").
   */
  @IsOptional()
  @IsString()
  public category?: string;
}