```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for aggregated catalog synchronization status per platform.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-008
// Purpose: Provides a summary of synchronization status for a catalog on a specific ad platform, intended for the merchant-facing dashboard.
// LogicDescription: Aggregates information from CatalogSyncHistory to present a concise status for each ad platform linked to a catalog.

import { AdPlatform } from '../../common/enums/ad-platform.enum';
import { SyncStatus } from '../../common/enums/sync-status.enum';
import { CatalogSyncHistoryDto } from './catalog-sync-history.dto'; // Assuming this DTO exists

export class SyncStatusDto {
  adPlatform: AdPlatform;
  lastSyncAttempt?: CatalogSyncHistoryDto;
  /** Derived status based on recent history for this platform */
  overallStatus: SyncStatus;
}
```