import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

// Configuration registration object (assuming it's default exported from the path)
// This file (integration.config.ts) is not generated in this step, but its import is anticipated.
import integrationConfig from './common/config/integration.config';

// Common providers local to the IntegrationModule
import { HttpClientService } from './common/providers/http-client.service';

// Core authentication module for integrations
// This file (auth.module.ts) is not generated in this step, but its import is anticipated.
import { AuthModule } from './auth/auth.module';

// Feature-specific integration sub-modules
// These files are not generated in this step, but their imports are anticipated.
import { AdNetworksIntegrationModule } from './ad-networks/ad-networks.module';
import { PaymentGatewaysIntegrationModule } from './payment-gateways/payment-gateways.module';
import { ShippingProvidersIntegrationModule } from './shipping-providers/shipping-providers.module';
import { AutomationToolsIntegrationModule } from './automation-tools/automation-tools.module';
import { ThirdPartyAppsIntegrationModule } from './third-party-apps/third-party-apps.module';

// Placeholder for CoreModule. According to SDS, IntegrationModule depends on CoreModule
// for shared services like ConfigService, LoggingService.
// For this isolated file generation, CoreModule import is commented out.
// In a complete application, CoreModule would be imported if it provides foundational services.
// import { CoreModule } from '../../core/core.module';

/**
 * @module IntegrationModule
 * @description The Backend.Integration.Module is responsible for handling all outbound
 * communication and integration with external third-party services.
 * It aggregates feature-specific integration modules and provides common services
 * like HttpClientService and authentication support via AuthModule.
 * It exports the feature-specific modules, making their facade services
 * (e.g., AdNetworksService, PaymentGatewaysService) available to other backend modules.
 *
 * @see SDS Section 1.1 (Purpose), 3.1 (IntegrationModule)
 * @see CodeFileDefinition for IntegrationModule
 *
 * Implemented Features: External Service Integration Orchestration
 * Requirement IDs: REQ-11-001
 * Namespace (Conceptual): AdManager.Platform.Backend.Integration
 */
@Module({
  imports: [
    // CoreModule, // Uncomment and ensure CoreModule is available and properly configured in the full application.
                  // It's expected to provide global ConfigService, LoggingService, etc.

    // Load and register module-specific configuration under the 'integration' namespace.
    // Assumes ConfigModule.forRoot() is called in the app's root module (e.g., AppModule or via CoreModule).
    NestConfigModule.forFeature(integrationConfig),

    // Provides authentication services (ExternalTokenService, OAuth2HandlerService, ApiKeyHandlerService)
    // crucial for HttpClientService and specific integration clients.
    AuthModule,

    // Feature-specific integration modules. These modules provide and export their respective facade services.
    AdNetworksIntegrationModule,
    PaymentGatewaysIntegrationModule,
    ShippingProvidersIntegrationModule,
    AutomationToolsIntegrationModule,
    ThirdPartyAppsIntegrationModule,
  ],
  providers: [
    // HttpClientService is a common, enhanced HTTP client for use by various integration
    // services within this module (e.g., GoogleAdsService, StripeService).
    // It incorporates common logic like auth injection, logging, error normalization,
    // and is designed to work with resilience patterns (retry, circuit breaker).
    HttpClientService,
  ],
  exports: [
    // Re-exporting the feature-specific modules makes their exported facade services
    // available to other backend modules that import this IntegrationModule.
    // This is the primary way other parts of the application interact with external services.
    AdNetworksIntegrationModule,
    PaymentGatewaysIntegrationModule,
    ShippingProvidersIntegrationModule,
    AutomationToolsIntegrationModule,
    ThirdPartyAppsIntegrationModule,

    // Export AuthModule if other modules require direct access to token management
    // or authentication flows beyond what the facade services provide.
    AuthModule,

    // Export HttpClientService if it's intended for direct, generic use by other modules.
    // Typically, interaction should be through the specialized facade services.
    HttpClientService,
  ],
})
export class IntegrationModule {}