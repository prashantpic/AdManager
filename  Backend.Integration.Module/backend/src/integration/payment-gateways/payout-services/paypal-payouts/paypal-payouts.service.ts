import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../../common/providers/http-client.service';
import { PayPalPayoutsApiConfig } from './paypal-payouts.config'; // Assuming this config file exists
import { ExternalServiceId } from '../../../common/enums/external-service.enum';
import { IntegrationException } from '../../../common/exceptions';

// Placeholder DTO, should be defined in a common or payout-specific DTOs folder
export interface PayoutItemDto {
  recipient_type: 'EMAIL' | 'PHONE' | 'PAYPAL_ID';
  amount: {
    value: string; // e.g., "10.00"
    currency: string; // e.g., "USD"
  };
  note?: string;
  sender_item_id?: string; // Unique ID for this item in the batch
  receiver: string; // Email, phone number, or PayPal Payer ID
}

@Injectable()
export class PayPalPayoutsService {
  private readonly logger = new Logger(PayPalPayoutsService.name);
  private readonly PAYPAL_API_BASE_URL: string;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly payPalPayoutsApiConfig: PayPalPayoutsApiConfig,
  ) {
    this.PAYPAL_API_BASE_URL = payPalPayoutsApiConfig.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  async sendPayoutBatch(payoutItems: PayoutItemDto[], batchDescription?: string): Promise<any> {
    const path = '/v1/payments/payouts'; // PayPal Payouts API endpoint

    const senderBatchId = `batch_${new Date().getTime()}_${Math.random().toString(36).substring(2, 10)}`;

    const payoutRequestBody = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: batchDescription || 'You have a payout!',
        email_message: batchDescription || 'You have received a payout from our platform.',
        // recipient_type: 'EMAIL', // Can be set here or per item
      },
      items: payoutItems,
    };

    try {
      this.logger.log(`Sending PayPal payout batch: ${senderBatchId}`);
      // Authentication for Payouts API (OAuth2 Bearer Token) is handled by HttpClientService
      // using ExternalTokenService, which would use PayPalPayoutsApiConfig.clientId and clientSecret.
      const response = await this.httpClientService.post(
        `${this.PAYPAL_API_BASE_URL}${path}`,
        payoutRequestBody,
        {}, // Additional headers if needed
        ExternalServiceId.PAYPAL_PAYOUTS, // Specific service ID for payouts
        undefined, // merchantId might not be relevant for platform-level payouts, or could be passed if needed
      );
      // Payouts can be asynchronous, response contains batch_status
      return response.data;
    } catch (error) {
      this.handlePayPalPayoutsError(error, 'sendPayoutBatch');
    }
  }

  async getPayoutBatchStatus(payoutBatchId: string): Promise<any> {
    const path = `/v1/payments/payouts/${payoutBatchId}`;
    try {
        this.logger.log(`Getting status for PayPal payout batch: ${payoutBatchId}`);
        const response = await this.httpClientService.get(
            `${this.PAYPAL_API_BASE_URL}${path}`,
            {},
            ExternalServiceId.PAYPAL_PAYOUTS,
            undefined,
        );
        return response.data;
    } catch (error) {
        this.handlePayPalPayoutsError(error, 'getPayoutBatchStatus');
    }
  }


  private handlePayPalPayoutsError(error: any, operation: string): never {
    this.logger.error(`PayPal Payouts API error during ${operation}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    const errorMessage = error.response?.data?.message || error.message;
    const errorName = error.response?.data?.name;
    const errorDetails = error.response?.data?.details;

    throw new IntegrationException(
      `PayPal Payouts API error during ${operation}: ${errorMessage} ${errorName ? `(${errorName})` : ''}`,
      ExternalServiceId.PAYPAL_PAYOUTS.toString(),
      error.response?.status || 500,
      { originalError: error, details: errorDetails },
      errorName,
    );
  }
}