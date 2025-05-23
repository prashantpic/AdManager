```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for feed generation requests.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-003
// Purpose: Specifies the format for generating a product catalog feed when requested via API.
// LogicDescription: Simple input DTO for the feed generation endpoint, validated to ensure a supported format is requested.

import { IsEnum } from 'class-validator';
import { FeedFormat } from '../../common/enums/feed-format.enum';

export class FeedGenerationRequestDto {
  @IsEnum(FeedFormat)
  format: FeedFormat;
}
```