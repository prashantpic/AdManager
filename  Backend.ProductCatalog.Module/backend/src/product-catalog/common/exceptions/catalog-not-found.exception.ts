// Namespace: AdManager.Platform.Backend.ProductCatalog.Common.Exceptions
import { NotFoundException } from '@nestjs/common';

/**
 * Exception thrown when a product catalog cannot be found.
 * REQ-PCM-001 (implicitly, when fetching/updating/deleting a specific catalog)
 */
export class CatalogNotFoundException extends NotFoundException {
  /**
   * @param catalogId The ID of the catalog that was not found.
   */
  constructor(catalogId: string) {
    super(`Product catalog with ID '${catalogId}' not found.`);
    this.name = 'CatalogNotFoundException';
  }
}