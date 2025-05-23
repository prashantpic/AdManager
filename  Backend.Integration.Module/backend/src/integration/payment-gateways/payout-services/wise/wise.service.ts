import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../../common/providers/http-client.service';
import { WiseApiConfig } from './wise.config'; // Assuming this config file exists
import { ExternalServiceId } from '../../../common/enums/external-service.enum';
import { IntegrationException } from '../../../common/exceptions';

// Placeholder DTO, should be defined based on Wise API requirements
// See https://docs.wise.com/api-docs/api-reference/transfer#create-transfer
export interface WiseTransferRequestDto {
  targetAccount: string; // ID of the recipient account
  quoteUuid: string; // ID of the quote for this transfer
  customerTransactionId: string; // Your unique ID for the transaction
  details?: {
    reference?: string;
    transferPurpose?: string;
    // ... other details
  };
}

@Injectable()
export class WisePayoutsService {
  private readonly logger = new Logger(WisePayoutsService.name);
  private readonly WISE_API_BASE_URL: string;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly wiseApiConfig: WiseApiConfig,
  ) {
    this.WISE_API_BASE_URL = wiseApiConfig.baseUrl || 'https://api.wise.com';
  }

  async createTransfer(transferDetails: WiseTransferRequestDto): Promise<any> {
    const path = '/v1/transfers'; // Wise API endpoint for creating transfers

    try {
      this.logger.log(`Creating Wise transfer: ${transferDetails.customerTransactionId}`);
      // Wise API uses an API token (Personal or Business) passed as a Bearer token.
      // This should be handled by HttpClientService via ExternalTokenService.
      // ExternalTokenService would use wiseApiConfig.apiKey if it's a static API key.
      const response = await this.httpClientService.post(
        `${this.WISE_API_BASE_URL}${path}`,
        transferDetails,
        {}, // Additional headers if needed
        ExternalServiceId.WISE_PAYOUTS,
        undefined, // merchantId might not be relevant, or could be profile ID if applicable
      );
      return response.data;
    } catch (error) {
      this.handleWiseError(error, 'createTransfer');
    }
  }

  // Other Wise API methods might include:
  // - Creating a quote
  // - Creating a recipient account
  // - Funding a transfer
  // - Cancelling a transfer
  // - Getting transfer status

  private handleWiseError(error: any, operation: string): never {
    this.logger.error(`Wise API error during ${operation}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // Wise API errors typically return a JSON body with an 'errors' array.
    // Example: { "errors": [ { "code": "...", "message": "...", "path": "..." } ] }
    const wiseErrors = error.response?.data?.errors;
    const errorMessage = wiseErrors?.[0]?.message || error.response?.data?.message || error.message;

    throw new IntegrationException(
      `Wise API error during ${operation}: ${errorMessage}`,
      ExternalServiceId.WISE_PAYOUTS.toString(),
      error.response?.status || 500,
      { originalError: error, wiseErrors },
      wiseErrors?.[0]?.code,
    );
  }
}