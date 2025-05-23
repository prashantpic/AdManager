import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { PayPalApiConfig } from './paypal.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException } from '../../common/exceptions';

// Assuming PayPal REST API v2
// DTOs for orderDetails would be defined based on PayPal's spec
// e.g., interface PayPalOrderRequestDto { intent: string; purchase_units: any[]; ... }

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly PAYPAL_API_BASE_URL: string;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly payPalApiConfig: PayPalApiConfig,
  ) {
    this.PAYPAL_API_BASE_URL = payPalApiConfig.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  async createOrder(merchantId: string, orderDetails: any): Promise<any> {
    const path = '/v2/checkout/orders';
    // orderDetails should conform to PayPal's Create Order request body
    // https://developer.paypal.com/docs/api/orders/v2/#orders_create
    try {
      this.logger.log(`Creating PayPal order for merchant ${merchantId}`);
      // Authentication (OAuth2 Bearer Token) is handled by HttpClientService via ExternalTokenService.
      // ExternalTokenService would use PayPalApiConfig.clientId and clientSecret for token generation.
      const response = await this.httpClientService.post(
        `${this.PAYPAL_API_BASE_URL}${path}`,
        orderDetails,
        { headers: { 'Prefer': 'return=representation' } }, // To get full resource representation
        ExternalServiceId.PAYPAL,
        merchantId,
      );
      return response.data;
    } catch (error) {
      this.handlePayPalError(error, 'createOrder', merchantId);
    }
  }

  async captureOrder(merchantId: string, orderId: string): Promise<any> {
    const path = `/v2/checkout/orders/${orderId}/capture`;
    try {
      this.logger.log(`Capturing PayPal order ${orderId} for merchant ${merchantId}`);
      const response = await this.httpClientService.post(
        `${this.PAYPAL_API_BASE_URL}${path}`,
        {}, // Capture request has an empty body
        { headers: { 'Prefer': 'return=representation' } },
        ExternalServiceId.PAYPAL,
        merchantId,
      );
      return response.data;
    } catch (error) {
      this.handlePayPalError(error, 'captureOrder', merchantId);
    }
  }

  // Placeholder for subscription creation if PayPal Subscriptions API is used
  // async createSubscription(merchantId: string, subscriptionDetails: any): Promise<any> {
  //   const path = '/v1/billing/subscriptions';
  //   // ... implementation
  // }

  private handlePayPalError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`PayPal API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // PayPal errors often come with a 'name' and 'details' in the response body
    const errorMessage = error.response?.data?.message || error.message;
    const errorName = error.response?.data?.name;
    const errorDetails = error.response?.data?.details;

    throw new IntegrationException(
      `PayPal API error during ${operation}: ${errorMessage} ${errorName ? `(${errorName})` : ''}` ,
      ExternalServiceId.PAYPAL.toString(),
      error.response?.status || 500,
      { originalError: error, details: errorDetails },
      errorName,
    );
  }
}