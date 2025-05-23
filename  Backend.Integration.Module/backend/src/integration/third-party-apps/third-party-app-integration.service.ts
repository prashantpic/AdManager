import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExternalServiceId } from '../common/enums/external-service.enum';
import { AdNetworksService } from '../ad-networks/ad-networks.service';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';
import { ShippingProvidersService } from '../shipping-providers/shipping-providers.service';
// import { AppStoreService } from '../../app-store/app-store.service'; // To verify app permissions
import { IntegrationException } from '../common/exceptions';

// Placeholder for request details structure. This will vary greatly.
export interface ProxiedRequestDetails {
  method: string; // e.g., 'createCampaign', 'processPayment'
  params: any; // Parameters for the target service method
}

@Injectable()
export class ThirdPartyAppIntegrationService {
  private readonly logger = new Logger(ThirdPartyAppIntegrationService.name);

  constructor(
    // Inject facade services from other integration sub-modules
    private readonly adNetworksService: AdNetworksService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly shippingProvidersService: ShippingProvidersService,
    // private readonly appStoreService: AppStoreService, // For app validation and permissions
  ) {}

  async proxyExternalApiCall(
    appId: string,
    merchantId: string,
    service: ExternalServiceId,
    requestDetails: ProxiedRequestDetails,
  ): Promise<any> {
    this.logger.log(`Proxying API call for app ${appId}, merchant ${merchantId}, service ${service}, method ${requestDetails.method}`);

    // 1. Authenticate/Authorize the app and its request for the merchant and service
    // const hasPermission = await this.appStoreService.verifyAppPermission(appId, merchantId, service, requestDetails.method);
    // For now, assume permission check passes or is handled by an upstream guard/interceptor
    const hasPermission = true; // Placeholder
    if (!hasPermission) {
      throw new ForbiddenException(`App ${appId} does not have permission to perform this action for merchant ${merchantId}.`);
    }

    // 2. Delegate to the appropriate facade service based on ExternalServiceId
    try {
      switch (service) {
        // Ad Networks
        case ExternalServiceId.GOOGLE_ADS:
        case ExternalServiceId.FACEBOOK_ADS:
        case ExternalServiceId.TIKTOK_ADS:
        case ExternalServiceId.SNAPCHAT_ADS:
          return this.handleAdNetworkCall(merchantId, service, requestDetails);

        // Payment Gateways
        case ExternalServiceId.STRIPE:
        case ExternalServiceId.PAYPAL:
        case ExternalServiceId.MADA:
        case ExternalServiceId.STC_PAY:
          return this.handlePaymentGatewayCall(merchantId, service, requestDetails);
        
        // Payout Services (if they are to be proxied)
        case ExternalServiceId.PAYPAL_PAYOUTS:
        case ExternalServiceId.WISE_PAYOUTS:
            return this.handlePayoutServiceCall(service, requestDetails); // merchantId might be implicit or part of params

        // Shipping Providers
        case ExternalServiceId.SHIPPO:
        // case ExternalServiceId.ARAMEX: // etc.
          return this.handleShippingProviderCall(merchantId, service, requestDetails);

        default:
          this.logger.warn(`Unsupported service ID for proxy: ${service}`);
          throw new BadRequestException(`Service ${service} is not supported for third-party app proxy.`);
      }
    } catch (error) {
        this.logger.error(`Error during proxied call for app ${appId}, merchant ${merchantId}, service ${service}: ${error.message}`, error.stack);
        if (error instanceof IntegrationException || error instanceof ForbiddenException || error instanceof NotFoundException) {
            throw error;
        }
        // Wrap other errors into a generic IntegrationException for the proxy context
        throw new IntegrationException(
            `Failed to proxy request for service ${service}: ${error.message}`,
            service.toString(), // Service that failed
            error.status || 500,
            error
        );
    }
  }

  private async handleAdNetworkCall(
    merchantId: string,
    network: ExternalServiceId, // GOOGLE_ADS, FACEBOOK_ADS etc.
    requestDetails: ProxiedRequestDetails,
  ): Promise<any> {
    const { method, params } = requestDetails;
    // Example: AdNetworksService methods are like: publishCampaign, syncProductCatalog, getCampaignPerformance
    // We need to map `requestDetails.method` to actual AdNetworksService methods and params.
    // This is a simplified dispatcher; a more robust solution might use a map or more specific DTOs.
    switch (method) {
      case 'publishCampaign':
        // Assuming params = { campaignDetails: any }
        return this.adNetworksService.publishCampaign(merchantId, params.campaignDetails, network);
      case 'syncProductCatalog':
        // Assuming params = { catalogData: ProductCatalogDto }
        return this.adNetworksService.syncProductCatalog(merchantId, params.catalogData, network);
      case 'getCampaignPerformance':
        // Assuming params = { campaignId: string }
        return this.adNetworksService.getCampaignPerformance(merchantId, params.campaignId, network);
      default:
        throw new BadRequestException(`Unsupported Ad Network method: ${method}`);
    }
  }

  private async handlePaymentGatewayCall(
    merchantId: string,
    gateway: ExternalServiceId, // STRIPE, PAYPAL etc.
    requestDetails: ProxiedRequestDetails,
  ): Promise<any> {
    const { method, params } = requestDetails;
    switch (method) {
      case 'processPayment':
        // Assuming params = { paymentDetails: ProcessPaymentRequestDto }
        return this.paymentGatewaysService.processPayment(merchantId, params.paymentDetails, gateway);
      case 'createSubscription':
         // Assuming params = { subscriptionDetails: CreateSubscriptionRequestDto }
        return this.paymentGatewaysService.createSubscription(merchantId, params.subscriptionDetails, gateway);
      // Add other payment gateway methods like refund, etc.
      default:
        throw new BadRequestException(`Unsupported Payment Gateway method: ${method}`);
    }
  }

  private async handlePayoutServiceCall(
    payoutService: ExternalServiceId, // PAYPAL_PAYOUTS, WISE_PAYOUTS
    requestDetails: ProxiedRequestDetails,
  ): Promise<any> {
    const { method, params } = requestDetails;
    // Note: PaymentGatewaysService facade handles both payments and payouts
    switch (method) {
      case 'processPayout':
        // Assuming params = { payoutDetails: ProcessPayoutRequestDto }
        return this.paymentGatewaysService.processPayout(params.payoutDetails, payoutService);
      default:
        throw new BadRequestException(`Unsupported Payout Service method: ${method}`);
    }
  }


  private async handleShippingProviderCall(
    merchantId: string,
    provider: ExternalServiceId, // SHIPPO etc.
    requestDetails: ProxiedRequestDetails,
  ): Promise<any> {
    const { method, params } = requestDetails;
    switch (method) {
      case 'getRates':
        // Assuming params = { shipmentDetails: ShipmentDetailsDto }
        return this.shippingProvidersService.getRates(params.shipmentDetails, provider); // merchantId might be implicit in shipmentDetails or needed
      case 'createLabel':
        // Assuming params = { createLabelDto: CreateLabelDto }
        return this.shippingProvidersService.createLabel(params.createLabelDto, provider);
      case 'trackShipment':
        // Assuming params = { trackingNumber: string, carrier: string }
        return this.shippingProvidersService.trackShipment(params.trackingNumber, params.carrier, provider);
      default:
        throw new BadRequestException(`Unsupported Shipping Provider method: ${method}`);
    }
  }
}