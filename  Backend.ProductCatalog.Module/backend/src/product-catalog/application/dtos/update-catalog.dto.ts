```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for catalog update requests.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-002, REQ-PCM-010
// Purpose: Defines the expected input structure and validation rules for updating a product catalog.
// LogicDescription: Contains validated fields that can be updated for a catalog. All fields are optional for partial updates.

import {
  IsString,
  MaxLength,
  IsOptional,
  ValidateNested,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OutOfStockRuleDto } from './out-of-stock-rule.dto'; // Assuming this DTO exists
import { Comment } from 'typeorm';

export class UpdateCatalogDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OutOfStockRuleDto) // Ensure OutOfStockRuleDto is defined and imported
  outOfStockRule?: OutOfStockRuleDto;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Comment('If provided, replaces all existing product items. To add/remove incrementally, separate endpoints might be needed.')
  productIds?: string[];
}
```