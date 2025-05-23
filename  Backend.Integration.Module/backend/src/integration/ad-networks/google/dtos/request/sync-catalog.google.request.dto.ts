import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';

// Placeholder for a Google-specific product item DTO.
// The actual structure will depend on the Google Content API or Merchant Center API requirements.
// This should be refined based on the specific Google API being used.
class GoogleProductItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  // Add other Google-specific fields as required by their API
  // e.g., price, link, image_link, availability, etc.
  [key: string]: any;
}

/**
 * Data Transfer Object for Google Ads product catalog synchronization request payload.
 * Defines the structured data for updating a product catalog/feed in Google Merchant Center
 * or via the Google Ads Content API.
 */
export class SyncCatalogGoogleRequestDto {
  /**
   * The ID of the feed in Google Merchant Center or a similar identifier.
   * This might vary based on the specific Google API (e.g., Content API for Shopping).
   */
  @IsString()
  @IsNotEmpty()
  feedId: string;

  /**
   * An array of product items to be synced.
   * Each item should conform to the structure required by the Google API.
   * These items are typically mapped from the platform's neutral ProductCatalogItemDto.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoogleProductItemDto) // Replace with actual Google Product Item DTO if more complex
  items: GoogleProductItemDto[]; // Should be an array of Google-specific product item DTOs
}