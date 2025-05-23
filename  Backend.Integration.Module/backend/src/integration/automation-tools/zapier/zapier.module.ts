```typescript
import { Module } from '@nestjs/common';
import { ZapierService } from './zapier.service';
import { ZapierController } from './zapier.controller';
import { ConfigModule } from '@nestjs/config'; // If Zapier specific config is needed

// Import other necessary modules if ZapierService depends on them, e.g., OrderModule, PromotionsModule
// For now, we assume ZapierService might have stubs or use CoreModule providers.

@Module({
  imports: [
    ConfigModule, // For API key or other Zapier related configurations
    // HttpModule, // If ZapierService itself makes HTTP calls for some reason
  ],
  controllers: [ZapierController],
  providers: [ZapierService],
  exports: [ZapierService],
})
export class ZapierIntegrationModule {}
```