import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { StcPayApiConfig } from './stc-pay.config'; // Assuming StcPayApiConfig exists
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException } from '../../common/exceptions';

// STC Pay integration will depend on their specific API documentation.
// This service provides a basic structure.

@Injectable()
export class StcPayService {
  private readonly logger = new Logger(StcPayService.name);
  private readonly STC_PAY_API_BASE_URL: string;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly stcPayApiConfig: StcPayApiConfig,
  ) {
    if (!this.stcPayApiConfig.baseUrl) {
        this.logger.error('STC Pay API base URL is not configured.');
        throw new IntegrationException('STC Pay API base URL missing.', ExternalServiceId.STC_PAY.toString());
    }
    this.STC_PAY_API_BASE_URL = this.stcPayApiConfig.baseUrl;
  }

  async initiatePayment(merchantId: string, paymentDetails: any): Promise<any> {
    // Example path, highly dependent on the STC Pay API
    const path = this.stcPayApiConfig.initiatePaymentEndpoint || '/payments/directpayment';

    // paymentDetails should conform to STC Pay's API requirements.
    // This often includes merchant identifiers, amount, order ID, callback URLs, etc.
    // Data mapping might be needed here.
    try {
      this.logger.log(`Initiating STC Pay payment for merchant ${merchantId}`);
      // STC Pay authentication (e.g., API keys, merchant IDs, tokens) would be
      // handled by HttpClientService via ExternalTokenService or specific headers from stcPayApiConfig.
      const response = await this.httpClientService.post(
        `${this.STC_PAY_API_BASE_URL}${path}`,
        paymentDetails,
        {}, // Headers might include Content-Type, Merchant-Id, specific STC Pay tokens
        ExternalServiceId.STC_PAY,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleStcPayError(error, 'initiatePayment', merchantId);
    }
  }

  private handleStcPayError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`STC Pay API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // Map specific STC Pay error codes/structures if known
    throw new IntegrationException(
      `STC Pay API error during ${operation}: ${error.message}`,
      ExternalServiceId.STC_PAY.toString(),
      error.response?.status || 500,
      error,
    );
  }
}