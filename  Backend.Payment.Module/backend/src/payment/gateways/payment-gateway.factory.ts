import { Injectable, NotSupportedException, Logger } from '@nestjs/common';
import { IPaymentGateway } from '../interfaces/payment-gateway.interface';
import { GatewayIdentifier } from '../constants/payment.constants';
import { StripeAdapter } from './adapters/stripe.adapter';
import { PayPalAdapter } from './adapters/paypal.adapter';
import { MadaAdapter } from './adapters/mada.adapter';
import { StcPayAdapter } from './adapters/stcpay.adapter';
import { ConfigService } from '@nestjs/config';
import { PaymentConfig } from '../config/payment.config';


@Injectable()
export class PaymentGatewayFactory {
  private readonly logger = new Logger(PaymentGatewayFactory.name);
  private readonly paymentSpecificConfig: PaymentConfig;

  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly payPalAdapter: PayPalAdapter,
    private readonly madaAdapter: MadaAdapter,
    private readonly stcPayAdapter: StcPayAdapter,
    private readonly configService: ConfigService, // Generic ConfigService from CoreModule
  ) {
     // Fetch the payment-specific part of the configuration
     this.paymentSpecificConfig = this.configService.get<PaymentConfig>('payment');
     if (!this.paymentSpecificConfig) {
         this.logger.error('Payment configuration (payment.*) not found. Gateway factory may not function correctly.');
         // Handle this error appropriately, perhaps by throwing or using defaults.
         // For now, we assume it's loaded by PaymentModule using ConfigModule.forFeature(paymentConfig).
     }
  }

  /**
   * Provides an instance of a specific payment gateway adapter.
   * @param gatewayIdentifier - The identifier of the desired gateway.
   * @returns An instance of the IPaymentGateway implementation for the specified gateway.
   * @throws NotSupportedException if the requested gateway is not enabled or supported.
   */
  getGateway(gatewayIdentifier: GatewayIdentifier): IPaymentGateway {
    this.logger.debug(`Getting gateway adapter for: ${gatewayIdentifier}`);
    if (!this.paymentSpecificConfig) {
        throw new NotSupportedException('Payment configuration is not available.');
    }

    switch (gatewayIdentifier) {
      case GatewayIdentifier.STRIPE:
         if (!this.paymentSpecificConfig.enableStripeGateway) {
             this.logger.warn('Attempted to get Stripe gateway adapter, but it is disabled in configuration.');
             throw new NotSupportedException(`Stripe gateway is not enabled.`);
         }
        return this.stripeAdapter;
      case GatewayIdentifier.PAYPAL:
         if (!this.paymentSpecificConfig.enablePayPalGateway) {
             this.logger.warn('Attempted to get PayPal gateway adapter, but it is disabled in configuration.');
             throw new NotSupportedException(`PayPal gateway is not enabled.`);
         }
        return this.payPalAdapter;
      case GatewayIdentifier.MADA:
         if (!this.paymentSpecificConfig.enableMadaGateway) {
             this.logger.warn('Attempted to get Mada gateway adapter, but it is disabled in configuration.');
             throw new NotSupportedException(`Mada gateway is not enabled.`);
         }
        return this.madaAdapter;
      case GatewayIdentifier.STCPAY:
         if (!this.paymentSpecificConfig.enableStcPayGateway) {
             this.logger.warn('Attempted to get STCPay gateway adapter, but it is disabled in configuration.');
             throw new NotSupportedException(`STCPay gateway is not enabled.`);
         }
        return this.stcPayAdapter;
      default:
        this.logger.error(`Unsupported gateway identifier requested: ${gatewayIdentifier}`);
        throw new NotSupportedException(`Gateway "${gatewayIdentifier}" is not supported.`);
    }
  }

   getWebhookSecret(gatewayIdentifier: GatewayIdentifier): string | undefined {
        if (!this.paymentSpecificConfig) {
            this.logger.error('Payment configuration not available for webhook secret retrieval.');
            return undefined;
        }
       switch (gatewayIdentifier) {
           case GatewayIdentifier.STRIPE:
               return this.paymentSpecificConfig.stripeWebhookSecret;
           case GatewayIdentifier.PAYPAL:
               return this.paymentSpecificConfig.paypalWebhookSecret;
           case GatewayIdentifier.MADA:
               return this.paymentSpecificConfig.madaWebhookSecret;
           case GatewayIdentifier.STCPAY:
               return this.paymentSpecificConfig.stcPayWebhookSecret;
           default:
               this.logger.warn(`No webhook secret configured for gateway: ${gatewayIdentifier}`);
               return undefined;
       }
   }
}