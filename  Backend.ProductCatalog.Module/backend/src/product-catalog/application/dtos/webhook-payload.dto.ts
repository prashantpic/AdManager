```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for webhook payloads.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-006
// Purpose: Defines a generic structure for webhook events related to product inventory changes from external e-commerce platforms.
// LogicDescription: Used by the controller's webhook handler or an SQS consumer to process incoming webhook data. The 'data' field will need specific parsing logic based on eventType or source platform.

import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class WebhookPayloadDto {
  /** e.g., 'product.updated', 'inventory.changed' */
  @IsNotEmpty()
  @IsString()
  eventType: string;

  /** Actual payload, structure depends on the source of the webhook */
  @IsObject() // Basic validation; specific validation would need custom logic or a more specific DTO
  data: any;
}
```