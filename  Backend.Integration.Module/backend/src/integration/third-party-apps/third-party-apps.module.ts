import { Module } from '@nestjs/common';
import { ThirdPartyAppIntegrationService } from './third-party-app-integration.service';
// Assuming AdNetworksService, PaymentGatewaysService, etc., are provided by their respective facade modules
// and those modules are imported globally or in a root IntegrationModule.
// For example:
// import { AdNetworksIntegrationModule } from '../ad-networks/ad-networks.module';
// import { PaymentGatewaysIntegrationModule } from '../payment-gateways/payment-gateways.module';

@Module({
  imports: [
    // These modules provide the facade services that ThirdPartyAppIntegrationService will use.
    // Ensure these are correctly imported and their services are available for injection.
    // AdNetworksIntegrationModule, // Example: Provides AdNetworksService
    // PaymentGatewaysIntegrationModule, // Example: Provides PaymentGatewaysService
    // ShippingProvidersIntegrationModule, // Example: Provides ShippingProvidersService
    // AppStoreModule, // This module would be needed to verify app permissions and identity (REQ-8-*)
  ],
  providers: [ThirdPartyAppIntegrationService],
  exports: [ThirdPartyAppIntegrationService],
})
export class ThirdPartyAppsIntegrationModule {}