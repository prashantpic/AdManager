import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeApiConfig } from './stripe.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import {
  IntegrationException,
  ExternalServiceAuthenticationException,
  ExternalServiceUnavailableException,
} from '../../common/exceptions';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private readonly stripeApiConfig: StripeApiConfig) {
    if (!this.stripeApiConfig.secretKey) {
      this.logger.error('Stripe secret key is not configured.');
      throw new ExternalServiceAuthenticationException(ExternalServiceId.STRIPE.toString(), 'Stripe secret key missing.');
    }
    this.stripe = new Stripe(this.stripeApiConfig.secretKey, {
      apiVersion: '2023-10-16', // Specify a fixed API version
      typescript: true,
    });
  }

  async createPaymentIntent(
    merchantId: string, // Used for logging or multi-tenant API key fetching if applicable
    amount: number, // Amount in smallest currency unit (e.g., cents)
    currency: string,
    paymentMethodId?: string,
    customerId?: string,
    metadata?: Stripe.MetadataParam,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Creating Stripe PaymentIntent for merchant ${merchantId}, amount: ${amount} ${currency}`);
      const params: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        payment_method: paymentMethodId,
        customer: customerId,
        automatic_payment_methods: paymentMethodId ? undefined : { enabled: true }, // Use APMs if no specific method
        confirm: !!paymentMethodId, // Confirm immediately if payment_method is provided
        confirmation_method: 'automatic',
        metadata: { platform_merchant_id: merchantId, ...metadata },
        // application_fee_amount: this.calculateApplicationFee(amount), // For Stripe Connect
      };
      if (paymentMethodId) {
        params.confirm = true;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(params);
      return paymentIntent;
    } catch (error) {
      this.handleStripeError(error, 'createPaymentIntent', merchantId);
    }
  }

  async createSubscription(
    merchantId: string,
    customerId: string,
    priceId: string,
    metadata?: Stripe.MetadataParam,
  ): Promise<Stripe.Subscription> {
    try {
      this.logger.log(`Creating Stripe Subscription for merchant ${merchantId}, customer ${customerId}, price ${priceId}`);
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { platform_merchant_id: merchantId, ...metadata },
        // application_fee_percent: this.calculateApplicationFeePercent(), // For Stripe Connect
      });
      return subscription;
    } catch (error) {
      this.handleStripeError(error, 'createSubscription', merchantId);
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    this.logger.log('Received Stripe webhook');
    if (!this.stripeApiConfig.webhookSecret) {
      this.logger.error('Stripe webhook secret is not configured.');
      throw new ExternalServiceAuthenticationException(ExternalServiceId.STRIPE.toString(), 'Stripe webhook secret missing.');
    }
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.stripeApiConfig.webhookSecret,
      );
      this.logger.log(`Stripe webhook event constructed successfully: ${event.id}, type: ${event.type}`);
      return event;
    } catch (err) {
      this.logger.error(`Error verifying Stripe webhook signature: ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }
  }

  private handleStripeError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`Stripe API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof Stripe.errors.StripeRawError) { // Base class for Stripe errors
        switch (error.type) {
            case 'StripeCardError': // A declined card error
                throw new IntegrationException(`Stripe card error: ${error.message}`, ExternalServiceId.STRIPE.toString(), error.statusCode, error, error.code);
            case 'StripeRateLimitError':
                throw new RateLimitExceededException(ExternalServiceId.STRIPE.toString(), error.message, undefined, error);
            case 'StripeInvalidRequestError':
                throw new IntegrationException(`Stripe invalid request: ${error.message}`, ExternalServiceId.STRIPE.toString(), error.statusCode, error, error.code);
            case 'StripeAPIError': // An error occurred internally with Stripe's API
                throw new ExternalServiceUnavailableException(ExternalServiceId.STRIPE.toString(), `Stripe API internal error: ${error.message}`, error);
            case 'StripeConnectionError': // Some kind of error connecting to Stripe
                throw new ExternalServiceUnavailableException(ExternalServiceId.STRIPE.toString(), `Stripe connection error: ${error.message}`, error);
            case 'StripeAuthenticationError':
                throw new ExternalServiceAuthenticationException(ExternalServiceId.STRIPE.toString(), `Stripe authentication error: ${error.message}`, error);
            default:
                throw new IntegrationException(`Stripe error: ${error.message}`, ExternalServiceId.STRIPE.toString(), error.statusCode, error, error.code);
        }
    }
    throw new IntegrationException(
      `Unhandled Stripe error during ${operation}: ${error.message}`,
      ExternalServiceId.STRIPE.toString(),
      500,
      error,
    );
  }
}