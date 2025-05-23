```typescript
import { Provider, Scope } from '@nestjs/common';

// Domain Interfaces - Repositories
import { ICampaignRepository } from './domain/interfaces/repositories/campaign.repository.interface';
import { IAdSetRepository } from './domain/interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from './domain/interfaces/repositories/ad.repository.interface';
import { IAudienceRepository } from './domain/interfaces/repositories/audience.repository.interface';
import { ICreativeRepository } from './domain/interfaces/repositories/creative.repository.interface';
import { ICampaignSyncLogRepository } from './domain/interfaces/repositories/campaign-sync-log.repository.interface';

// Infrastructure Implementations - Repositories
import { TypeOrmCampaignRepository } from './infrastructure/repositories/typeorm-campaign.repository';
import { TypeOrmAdSetRepository } from './infrastructure/repositories/typeorm-ad-set.repository';
import { TypeOrmAdRepository } from './infrastructure/repositories/typeorm-ad.repository';
import { TypeOrmAudienceRepository } from './infrastructure/repositories/typeorm-audience.repository';
import { TypeOrmCreativeRepository } from './infrastructure/repositories/typeorm-creative.repository';
import { TypeOrmCampaignSyncLogRepository } from './infrastructure/repositories/typeorm-campaign-sync-log.repository';

// Domain Interfaces - Services (Adapters)
import { IAdNetworkIntegrationService } from './domain/interfaces/services/ad-network-integration.interface';
import { IProductCatalogQueryService } from './domain/interfaces/services/product-catalog-query.interface';
import { IPromotionQueryService } from './domain/interfaces/services/promotion-query.interface';
import { IEntitlementValidationService } from './domain/interfaces/services/entitlement-validation.interface';
import { IAssetStorageService } from './domain/interfaces/services/asset-storage.interface';
import { IUserContextProvider } from './domain/interfaces/services/user-context-provider.interface';

// Infrastructure Implementations - Adapters
import { AdNetworkAdapter } from './infrastructure/adapters/ad-network.adapter';
import { ProductCatalogAdapter } from './infrastructure/adapters/product-catalog.adapter';
import { PromotionAdapter } from './infrastructure/adapters/promotion.adapter';
import { EntitlementAdapter } from './infrastructure/adapters/entitlement.adapter';
import { AssetStorageAdapter } from './infrastructure/adapters/asset-storage.adapter';
import { UserContextProviderAdapter } from './infrastructure/adapters/user-context-provider.adapter';

// Domain Services
import { CampaignFactory } from './domain/domain-services/campaign-factory.service';
import { CampaignValidatorService } from './domain/domain-services/campaign-validator.service';
import { CampaignDuplicatorService } from './domain/domain-services/campaign-duplicator.service';
import { CampaignPublisherService } from './domain/domain-services/campaign-publisher.service';
import { CampaignAssetLinkerService } from './domain/domain-services/campaign-asset-linker.service';

// Application Services
import { CampaignCrudService } from './application/services/campaign-crud.service';
import { CampaignOrchestrationService } from './application/services/campaign-orchestration.service';
import { AudienceService } from './application/services/audience.service';
import { CreativeManagementService } from './application/services/creative-management.service';
import { CampaignPreviewService } from './application/services/campaign-preview.service';

// Mappers
import { CampaignMapper } from './application/mappers/campaign.mapper';
import { AdSetMapper } from './application/mappers/ad-set.mapper';
import { AdMapper } from './application/mappers/ad.mapper';
import { AudienceMapper } from './application/mappers/audience.mapper';
import { CreativeMapper } from './application/mappers/creative.mapper';
import { CampaignSyncLogMapper } from './application/mappers/campaign-sync-log.mapper';

export const adCampaignProviders: Provider[] = [
  // Repositories
  { provide: ICampaignRepository, useClass: TypeOrmCampaignRepository },
  { provide: IAdSetRepository, useClass: TypeOrmAdSetRepository },
  { provide: IAdRepository, useClass: TypeOrmAdRepository },
  { provide: IAudienceRepository, useClass: TypeOrmAudienceRepository },
  { provide: ICreativeRepository, useClass: TypeOrmCreativeRepository },
  { provide: ICampaignSyncLogRepository, useClass: TypeOrmCampaignSyncLogRepository },

  // External Service Adapters
  { provide: IAdNetworkIntegrationService, useClass: AdNetworkAdapter },
  { provide: IProductCatalogQueryService, useClass: ProductCatalogAdapter },
  { provide: IPromotionQueryService, useClass: PromotionAdapter },
  { provide: IEntitlementValidationService, useClass: EntitlementAdapter },
  { provide: IAssetStorageService, useClass: AssetStorageAdapter },
  {
    provide: IUserContextProvider,
    useClass: UserContextProviderAdapter,
    scope: Scope.REQUEST, // As specified in SDS for UserContextProviderAdapter
  },

  // Domain Services
  CampaignFactory,
  CampaignValidatorService,
  CampaignDuplicatorService,
  CampaignPublisherService,
  CampaignAssetLinkerService,

  // Application Services
  CampaignCrudService,
  CampaignOrchestrationService,
  AudienceService,
  CreativeManagementService,
  CampaignPreviewService,

  // Mappers
  CampaignMapper,
  AdSetMapper,
  AdMapper,
  AudienceMapper,
  CreativeMapper,
  CampaignSyncLogMapper,
];