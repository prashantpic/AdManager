import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingRuleEntity } from './rules/entities/shipping-rule.entity';
import { ShippingRuleRepository } from './rules/repositories/shipping-rule.repository';
import { ShippingRuleService } from './rules/services/shipping-rule.service';
import { ShippingRuleEngineService } from './rules/services/shipping-rule-engine.service';
import { ShippingConfigModule } from './config/shipping-config.module';
import { ShippingConfigService } from './config/shipping-config.service';
import { FallbackShippingService } from './providers/fallback/fallback.service';
import { FallbackShippingProvider } from './providers/fallback/fallback.provider';
import { FedExShippingProvider } from './providers/fedex/fedex.provider';
import { UPSShippingProvider } from './providers/ups/ups.provider';
import { DHLShippingProvider } from './providers/dhl/dhl.provider';
import { ShippoShippingProvider } from './providers/shippo/shippo.provider';
import { FedExMapper } from './providers/fedex/fedex.mapper';
import { UPSMapper } from './providers/ups/ups.mapper';
import { DHLMapper } from './providers/dhl/dhl.mapper';
import { ShippoMapper } from './providers/shippo/shippo.mapper';
import { IShippingProvider } from './core/interfaces/shipping-provider.interface';
import { CarrierCode } from './core/enums/carrier-code.enum';

// Assume HttpClientService and CacheService are provided globally or by an imported CoreModule
// For example, if they are part of a global CoreModule, they can be injected.
// If not, they need to be imported/provided explicitly.
// We will assume they are injectable as per the design specification.
// For instance, `HttpClientModule` from `@nestjs/axios` might be used by `HttpClientService`.
import { HttpClientService, CacheService } from '@admanager/backend.core.module';

// Helper function to create provider factories
const createShippingProviderFactory = (
  ProviderClass: new (mapper: any, httpClient: HttpClientService, configService: ShippingConfigService) => IShippingProvider,
  MapperClass: new () => any,
): Provider => ({
  provide: ProviderClass.prototype.getProviderCode(), // Uses the getProviderCode from the prototype
  useFactory: (mapper: any, httpClient: HttpClientService, configService: ShippingConfigService) => {
    // Check if the provider is enabled in config before instantiating
    // This check can also be done inside the ShippingService when deciding which provider to call
    if (configService.isProviderEnabled(ProviderClass.prototype.getProviderCode())) {
      return new ProviderClass(mapper, httpClient, configService);
    }
    // If not enabled, return a "null" provider or handle appropriately.
    // For now, we instantiate, and ShippingService will filter based on enabled providers.
    // Or, one might choose to not provide it at all, requiring ShippingService to handle missing injections.
    // The current ShippingService design expects providers to be injected, so we instantiate.
    return new ProviderClass(mapper, httpClient, configService);
  },
  inject: [MapperClass, HttpClientService, ShippingConfigService],
});

@Module({
  imports: [
    ShippingConfigModule, // Provides ShippingConfigService
    TypeOrmModule.forFeature([ShippingRuleEntity]),
    // If HttpClientModule (from @nestjs/axios) is used by HttpClientService, it should be imported
    // in the CoreModule or AppModule.
  ],
  controllers: [ShippingController],
  providers: [
    // Core Services
    ShippingService,
    ShippingRuleService,
    ShippingRuleEngineService,
    ShippingRuleRepository,

    // Fallback Mechanism
    FallbackShippingService,
    FallbackShippingProvider,

    // Mappers
    FedExMapper,
    UPSMapper,
    DHLMapper,
    ShippoMapper,

    // Concrete Shipping Providers, provided with CarrierCode as token
    createShippingProviderFactory(FedExShippingProvider, FedExMapper),
    createShippingProviderFactory(UPSShippingProvider, UPSMapper),
    createShippingProviderFactory(DHLShippingProvider, DHLMapper),
    createShippingProviderFactory(ShippoShippingProvider, ShippoMapper),

    // HttpClientService and CacheService are assumed to be available for injection
    // either globally or through an imported CoreModule.
    // If they are not globally available and CoreModule is not imported here,
    // they would need to be explicitly provided/imported.
    // Example:
    // { provide: HttpClientService, useClass: HttpClientService }, // If HttpClientService is self-contained
    // { provide: CacheService, useClass: CacheService }, // If CacheService is self-contained
  ],
  exports: [
    ShippingService,
    ShippingRuleService,
    // Do not export individual providers or mappers unless explicitly needed by other modules.
    // ShippingService acts as the facade.
  ],
})
export class ShippingModule {}