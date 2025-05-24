import { Module, CacheModule, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EntitlementService } from './services/entitlement.service';
import { EntitlementCacheService } from './services/entitlement-cache.service';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { SubscriptionPlanChangeListener } from './event-listeners/subscription-plan-change.listener';
import { entitlementConfiguration } from './config/entitlement.config';

// --- Conceptual Imports from other modules ---
// These would be actual module imports in a real monorepo application.
// They are listed here to represent the dependencies described in the Software Design Specification.

// Example: For User Authentication context (ADM-BE-USERAUTH-001)
// import { UserAuthModule } from '../user-auth/user-auth.module';

// Example: For Subscription Data (ADM-BE-SUBSCRIPTION-001), providing ISubscriptionDataProvider
// import { SubscriptionModule } from '../subscription/subscription.module';

// Example: For Merchant Usage Data (e.g., ADM-BE-ADCAMP-001, ADM-BE-PRODCAT-001), providing IMerchantUsageProvider
// import { AdCampaignModule } from '../ad-campaign/ad-campaign.module';
// import { ProductCatalogModule } from '../product-catalog/product-catalog.module';

// Example: For Core functionalities like a pre-configured CacheModule if not using CacheModule.register() directly
// import { CoreModule } from '../core/core.module';


@Module({
  imports: [
    ConfigModule.forFeature(entitlementConfiguration),
    // Registers CacheModule. Assumes Redis configuration is handled globally (e.g., in AppModule or CoreModule)
    // or that EntitlementCacheService will specifically use a Redis client.
    // If CoreModule provides a fully configured CacheManager, import CoreModule instead.
    CacheModule.register(),

    // The EntitlementService and other components within this module may depend on providers
    // from the modules listed below (conceptually).
    // `forwardRef` is used to handle potential circular dependencies, especially if
    // these external modules also import `EntitlementModule` (e.g., to use its Guards).

    // Placeholder for UserAuthModule import (provides merchant context)
    // forwardRef(() => UserAuthModule),

    // Placeholder for SubscriptionModule import (provides ISubscriptionDataProvider)
    // forwardRef(() => SubscriptionModule),

    // Placeholders for modules providing IMerchantUsageProvider implementations
    // forwardRef(() => AdCampaignModule),
    // forwardRef(() => ProductCatalogModule),
    // ... other modules providing usage data
  ],
  providers: [
    EntitlementService,
    EntitlementCacheService,
    FeatureAccessGuard,
    SubscriptionPlanChangeListener,
    // Note: `ISubscriptionDataProvider` and `IMerchantUsageProvider[]` are injected
    // into `EntitlementService`. The actual providers for these interfaces are expected
    // to be exported by the modules conceptually imported above.
  ],
  exports: [
    EntitlementService,
    FeatureAccessGuard,
    // Decorators like @HasEntitlement are typically imported directly from their file,
    // not exported via a module.
  ],
})
export class EntitlementModule {}