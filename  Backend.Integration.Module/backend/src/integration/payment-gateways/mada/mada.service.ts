import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { MadaApiConfig } from './mada.config'; // Assuming MadaApiConfig exists
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException } from '../../common/exceptions';

// This is a generic Mada service. Specific Mada providers (e.g., Moyasar, PayTabs, HyperPay)
// will have different API endpoints, request/response structures, and authentication.
// This service would need to be adapted or specialized for a chosen provider.

@Injectable()
export class MadaService {
  private readonly logger = new Logger(MadaService.name);
  private readonly MADA_PROVIDER_API_BASE_URL: string;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly madaApiConfig: MadaApiConfig,
  ) {
    if (!this.madaApiConfig.baseUrl) {
        this.logger.error('Mada provider API base URL is not configured.');
        throw new IntegrationException('Mada provider API base URL missing.', ExternalServiceId.MADA.toString());
    }
    this.MADA_PROVIDER_API_BASE_URL = this.madaApiConfig.baseUrl;
  }

  async initiatePayment(merchantId: string, paymentDetails: any): Promise<any> {
    // Example path, highly dependent on the Mada provider
    const path = this.madaApiConfig.initiatePaymentEndpoint || '/payments';

    // paymentDetails should conform to the specific Mada provider's API requirements
    // Data mapping might be needed here.
    try {
      this.logger.log(`Initiating Mada payment for merchant ${merchantId}`);
      // Authentication details (API keys, etc.) for Mada provider would be handled by
      // HttpClientService via ExternalTokenService or by injecting them directly from madaApiConfig
      // if it's a simple API key auth not fitting OAuth2 flow.
      // For this example, assuming HttpClientService handles it with ExternalServiceId.MADA context.
      const response = await this.httpClientService.post(
        `${this.MADA_PROVIDER_API_BASE_URL}${path}`,
        paymentDetails,
        {}, // Additional config, headers might be needed here based on provider
        ExternalServiceId.MADA,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleMadaError(error, 'initiatePayment', merchantId);
    }
  }

  private handleMadaError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`Mada Provider API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // Map specific Mada provider errors if their structure is known
    throw new IntegrationException(
      `Mada Provider API error during ${operation}: ${error.message}`,
      ExternalServiceId.MADA.toString(),
      error.response?.status || 500,
      error,
    );
  }
}