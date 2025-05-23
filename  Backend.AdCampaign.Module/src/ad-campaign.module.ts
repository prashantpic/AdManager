import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { AdCampaignController } from './ad-campaign.controller';
import { adCampaignProviders } from './ad-campaign.providers';

import {
  Campaign,
  AdSet,
  Ad,
  Audience,
  Creative,
  Budget,
  Schedule,
  CampaignSyncLog,
} from './domain/entities';

// Guards - to be provided if not covered by adCampaignProviders or a global/core module
import { CampaignOwnerGuard } from './guards/campaign-owner.guard';
import { FeatureAccessGuard } from './guards/feature-access.guard';

// Placeholder for imports from other modules providing services/clients for adapters
// e.g., import { IntegrationModuleClient } from '../integration/integration.module'; // ADM-BE-INTEGRATION-001
// e.g., import { ProductCatalogModuleClient } from '../product-catalog/product-catalog.module'; // ADM-BE-PRODCAT-001
// e.g., import { PromotionsModuleClient } from '../promotions/promotions.module'; // ADM-BE-PROMO-001
// e.g., import { EntitlementModuleClient } from '../entitlement/entitlement.module'; // ADM-BE-ENTITLEMENT-001
// e.g., import { CoreModule } from '../core/core.module'; // ADM-BE-CORE-001 (for S3 service, config, etc.)
// e.g., import { UserAuthModule } from '../user-auth/user-auth.module'; // ADM-BE-USERAUTH-001

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      AdSet,
      Ad,
      Audience,
      Creative,
      Budget,
      Schedule,
      CampaignSyncLog,
    ]),
    CqrsModule,
    // --- Example of importing other modules that AdCampaignModule depends on for its adapters ---
    // forwardRef(() => IntegrationModuleClient), // For IAdNetworkIntegrationService adapter
    // forwardRef(() => ProductCatalogModuleClient), // For IProductCatalogQueryService adapter
    // forwardRef(() => PromotionsModuleClient), // For IPromotionQueryService adapter
    // forwardRef(() => EntitlementModuleClient), // For IEntitlementValidationService adapter
    // forwardRef(() => CoreModule), // For IAssetStorageService adapter, common utilities
    // forwardRef(() => UserAuthModule), // For IUserContextProvider if it needs more than just request scope
  ],
  controllers: [AdCampaignController],
  providers: [
    ...adCampaignProviders,
    CampaignOwnerGuard, // Provided here as per analysis of spec
    FeatureAccessGuard,   // Provided here as per analysis of spec
    // Event Handlers for domain events would be listed here if using NestJS CQRS pattern
    // e.g., CampaignCreatedHandler, CampaignPublishedHandler etc.
  ],
  exports: [
    // Services or repositories from this module that are intended to be used directly by other modules.
    // Based on the SDS, direct exports might be minimal as adapters are preferred for inter-module communication.
    // e.g. TypeOrmModule (if other modules need to use these entities directly, though unlikely)
  ],
})
export class AdCampaignModule {}