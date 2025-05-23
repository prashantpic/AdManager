```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for catalog API responses.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-001, REQ-PCM-008
// Purpose: Provides a structured and client-friendly representation of catalog data for API responses.
// LogicDescription: Used to serialize catalog information for API clients. May include summary information like product count or last sync status.

import { AdPlatform } from '../../common/enums/ad-platform.enum';
import { OutOfStockRuleDto } from './out-of-stock-rule.dto'; // Assuming this DTO exists
import { CatalogSyncHistoryDto } from './catalog-sync-history.dto'; // Assuming this DTO exists

export class CatalogDto {
  id: string;
  name: string;
  description?: string;
  adPlatform: AdPlatform;
  outOfStockRule: OutOfStockRuleDto;
  productItemsCount: number;
  /** Represents the latest sync attempt for this catalog's adPlatform */
  lastSync?: CatalogSyncHistoryDto;
  createdAt: Date;
  updatedAt: Date;
}
```