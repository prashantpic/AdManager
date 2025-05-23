```typescript
// Namespace: AdManager.Platform.Backend.ProductCatalog.Application.Dtos
// ComponentId: product-catalog-controller-001
// Summary: DTO for catalog creation requests.
// Version: 1.0.0
// Stability: Production
// RequirementIds: REQ-PCM-001, REQ-PCM-002, REQ-PCM-010
// Purpose: Defines the expected input structure and validation rules for creating a product catalog via the API.
// LogicDescription: Contains fields required to instantiate a new catalog. Uses class-validator decorators for input validation processed by NestJS ValidationPipe.

import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdPlatform } from '../../common/enums/ad-platform.enum';
import { OutOfStockRuleDto } from './out-of-stock-rule.dto'; // Assuming this DTO exists

export class CreateCatalogDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(AdPlatform)
  adPlatform: AdPlatform;

  @ValidateNested()
  @Type(() => OutOfStockRuleDto) // Ensure OutOfStockRuleDto is defined and imported
  outOfStockRule: OutOfStockRuleDto;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}
```