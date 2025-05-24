import { Injectable, Logger } from '@nestjs/common';
import { IPaymentGateway } from '../../interfaces/payment-gateway.interface';
import { ProcessPaymentDto } from '../../dto/process-payment.dto';
import { PaymentResponseDto } from '../../dto/payment-response.dto';
import { RefundPaymentDto } from '../../dto/refund-payment.dto';
import { CreateRecurringPaymentDto } from '../../dto/create-recurring-payment.dto';
import { RecurringPaymentDetailsDto } from '../../dto/recurring-payment-details.dto';
import { CancelRecurringPaymentDto } from '../../dto/cancel-recurring-payment.dto';
import { WebhookEventDto } from '../../dto/webhook-event.dto';
import { PaymentStatus, GatewayIdentifier } from '../../constants/payment.constants';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGatewayIntegrationException,
  RefundProcessingException,
  SubscriptionManagementErrorException
} from '../../exceptions/payment.exceptions';
import { PayPalClient } from '../../../integration/gateways/clients/paypal/paypal.client'; // Simulated Import
import { PaymentConfig } from '../../config/payment.config';

@Injectable()
export class PayPalAdapter implements IPaymentGateway {
   private readonly logger = new Logger(PayPalAdapter.name);
   private readonly webhookId: string; // PayPal uses Webhook ID for verification typically

  constructor(
    private readonly payPalClient: PayPalClient,
    private readonly configService: ConfigService<PaymentConfig>,
  ) {
     this.webhookId = this.configService.get<string>('payment.paypalWebhookSecret'); // Using secret field for Webhook ID
     if (!this.webhookId) {
        this.logger.warn('PayPal webhook ID (secret) is not configured. Webhook verification may fail.');
     }
  }

   async processPayment(paymentDetails: ProcessPaymentDto): Promise<PaymentResponseDto> {
     try {
       const order = await this.payPalClient.orders.create({
           intent: 'CAPTURE',
           purchase_units: [{
               amount: {
                   currency_code: paymentDetails.currency,
                   value: paymentDetails.amount.toFixed(2),
               },
               custom_id: paymentDetails.orderId,
               description: paymentDetails.description,
           }],
           payment_source: {
                token: {
                    id: paymentDetails.paymentMethodToken, // Vaulted payment method ID
                    type: 'VAULT_TOKEN' // This type depends on PayPal API version and vaulting method
                }
            }
       });

       this.logger.log(`PayPal payment processed, Order ID: ${order.id}, Status: ${order.status}`);
       const capture = order.purchase_units[0]?.payments?.captures?.[0];
       const status = this.mapPayPalStatusToPaymentStatus(order.status);

       return {
           transactionId: '',
           gatewayTransactionId: capture?.id || order.id,
           status: status,
           message: order.status === 'COMPLETED' ? 'Payment successful' : `PayPal status: ${order.status}`,
           gatewayResponse: { order, capture },
       };

     } catch (error) {
       this.logger.error(`PayPal payment processing failed: ${error.message}`, error.stack);
       const gatewayError = error.response?.data || error;
       throw new PaymentGatewayIntegrationException(GatewayIdentifier.PAYPAL, `Error processing payment: ${error.message}`, gatewayError, error);
     }
   }

   async refundPayment(refundDetails: RefundPaymentDto): Promise<PaymentResponseDto> {
     try {
        const paypalRefundParams = {
            amount: {
                currency_code: 'USD', // Placeholder: Should come from original transaction
                value: refundDetails.amount ? refundDetails.amount.toFixed(2) : undefined,
            },
            note_to_payer: refundDetails.reason,
        };

        this.logger.debug(`Calling PayPal refunds.create on Capture ID ${refundDetails.gatewayTransactionId}`);
        const refund = await this.payPalClient.captures.refund(refundDetails.gatewayTransactionId, paypalRefundParams);
        this.logger.log(`PayPal refund initiated/successful: ${refund.id}, Status: ${refund.status}`);

        return {
           transactionId: '',
           gatewayTransactionId: refund.id,
           status: this.mapPayPalRefundStatusToPaymentStatus(refund.status),
           message: refund.status === 'COMPLETED' ? 'Refund successful' : `PayPal refund status: ${refund.status}`,
           gatewayResponse: refund,
       };

     } catch (error) {
       this.logger.error(`PayPal refund failed: ${error.message}`, error.stack);
       const gatewayError = error.response?.data || error;
       throw new RefundProcessingException(`Error processing PayPal refund: ${error.message}`, gatewayError);
     }
   }

   async createRecurringPayment(subscriptionDetails: CreateRecurringPaymentDto): Promise<RecurringPaymentDetailsDto> {
       try {
           const paypalSubscriptionParams = {
               plan_id: subscriptionDetails.planId,
               // Assuming paymentMethodToken is a PayPal vaulted token ID
               payment_source: {
                  token: {
                      id: subscriptionDetails.paymentMethodToken,
                      type: 'VAULT_TOKEN' // Or appropriate token type
                  }
               },
               // Subscriber details, application_context, etc.
               custom_id: `${subscriptionDetails.merchantId}_${subscriptionDetails.customerId}`,
           };

           this.logger.debug(`Calling PayPal subscriptions.create with params: ${JSON.stringify(paypalSubscriptionParams)}`);
           const subscription = await this.payPalClient.subscriptions.create(paypalSubscriptionParams);
           this.logger.log(`PayPal subscription created: ${subscription.id}`);

           return {
               gatewaySubscriptionId: subscription.id,
               status: subscription.status,
               currentPeriodStart: subscription.billing_info?.last_payment?.time ? new Date(subscription.billing_info.last_payment.time) : undefined,
               currentPeriodEnd: subscription.billing_info?.next_billing_time ? new Date(subscription.billing_info.next_billing_time) : undefined,
               nextBillingDate: subscription.billing_info?.next_billing_time ? new Date(subscription.billing_info.next_billing_time) : undefined,
               planDetails: { plan_id: subscription.plan_id, status: subscription.status },
           };
       } catch (error) {
           this.logger.error(`PayPal recurring payment setup failed: ${error.message}`, error.stack);
           const gatewayError = error.response?.data || error;
           throw new SubscriptionManagementErrorException(GatewayIdentifier.PAYPAL, `Error setting up recurring payment: ${error.message}`, gatewayError, error);
       }
   }

   async getRecurringPaymentDetails(gatewaySubscriptionId: string): Promise<RecurringPaymentDetailsDto> {
       try {
           this.logger.debug(`Calling PayPal subscriptions.get for ID: ${gatewaySubscriptionId}`);
           const subscription = await this.payPalClient.subscriptions.get(gatewaySubscriptionId);
           this.logger.log(`PayPal subscription retrieved: ${subscription.id}`);

           return {
               gatewaySubscriptionId: subscription.id,
               status: subscription.status,
               currentPeriodStart: subscription.billing_info?.last_payment?.time ? new Date(subscription.billing_info.last_payment.time) : undefined,
               currentPeriodEnd: subscription.billing_info?.next_billing_time ? new Date(subscription.billing_info.next_billing_time) : undefined,
               nextBillingDate: subscription.billing_info?.next_billing_time ? new Date(subscription.billing_info.next_billing_time) : undefined,
               planDetails: { plan_id: subscription.plan_id, status: subscription.status },
           };
       } catch (error) {
           this.logger.error(`PayPal recurring payment details retrieval failed for ID ${gatewaySubscriptionId}: ${error.message}`, error.stack);
           const gatewayError = error.response?.data || error;
           throw new SubscriptionManagementErrorException(GatewayIdentifier.PAYPAL, `Error retrieving recurring payment details: ${error.message}`, gatewayError, error);
       }
   }

   async cancelRecurringPayment(cancelDetails: CancelRecurringPaymentDto): Promise<void> {
       try {
           this.logger.debug(`Calling PayPal subscriptions.cancel for ID: ${cancelDetails.gatewaySubscriptionId}`);
           await this.payPalClient.subscriptions.cancel(cancelDetails.gatewaySubscriptionId, { reason: 'Cancellation requested by merchant.' });
           this.logger.log(`PayPal subscription cancellation requested for ID: ${cancelDetails.gatewaySubscriptionId}`);
       } catch (error) {
           this.logger.error(`PayPal recurring payment cancellation failed for ID ${cancelDetails.gatewaySubscriptionId}: ${error.message}`, error.stack);
           const gatewayError = error.response?.data || error;
           throw new SubscriptionManagementErrorException(GatewayIdentifier.PAYPAL, `Error canceling recurring payment: ${error.message}`, gatewayError, error);
       }
   }

  verifyWebhookSignature(payload: string | Buffer, signature: string, webhookId: string): boolean {
       // PayPal webhook verification often involves the SDK call `verify()`
       // Requires request headers, raw body, and webhook ID (configured as secret)
       // This is a simplified example
       try {
            this.logger.debug('Verifying PayPal webhook signature...');
            // This is a conceptual call; the actual PayPal SDK method might differ
            // For example: payPalClient.webhooks.verify(headers, rawBody, this.webhookId);
            // Here, `secret` is actually the `webhookId`
            const isValid = this.payPalClient.webhooks.verifySignature({
                authAlgo: '', // Get from headers
                certUrl: '', // Get from headers
                transmissionId: '', // Get from headers
                transmissionSig: signature, // Signature
                transmissionTime: '', // Get from headers
                webhookId: webhookId, // The configured webhook ID (passed as 'secret')
                webhookEvent: payload, // Raw body
            });
            if (isValid) {
                 this.logger.debug('PayPal webhook signature verified successfully.');
                 return true;
            } else {
                 this.logger.warn('PayPal webhook signature verification returned false.');
                 return false;
            }
       } catch (err) {
           this.logger.error(`PayPal webhook signature verification failed: ${err.message}`);
           return false;
       }
   }

  parseWebhookEvent(rawPayload: any): WebhookEventDto {
       const event = rawPayload as any;
       this.logger.debug(`Parsing PayPal webhook event type: ${event.event_type}`);
       const payloadData = event.resource || event;

       return {
           gateway: GatewayIdentifier.PAYPAL,
           eventType: event.event_type,
           payload: payloadData,
           receivedAt: new Date(event.create_time || Date.now()),
       };
  }

    private mapPayPalStatusToPaymentStatus(paypalStatus: string): PaymentStatus {
        switch (paypalStatus?.toUpperCase()) {
            case 'CREATED':
            case 'SAVED':
            case 'APPROVED':
            case 'PAYER_ACTION_REQUIRED':
                return PaymentStatus.PENDING;
            case 'COMPLETED':
            case 'CAPTURED': // For orders
                return PaymentStatus.SUCCESSFUL;
            case 'VOIDED':
            case 'DECLINED':
                return PaymentStatus.FAILED;
            default:
                this.logger.warn(`Unknown or unmapped PayPal payment status: ${paypalStatus}`);
                return PaymentStatus.FAILED;
        }
    }

     private mapPayPalRefundStatusToPaymentStatus(paypalRefundStatus: string): PaymentStatus {
         switch (paypalRefundStatus?.toUpperCase()) {
             case 'PENDING':
                 return PaymentStatus.PENDING;
             case 'COMPLETED':
                 return PaymentStatus.SUCCESSFUL;
             case 'CANCELLED':
             case 'FAILED':
             default:
                 this.logger.warn(`Unknown or unmapped PayPal refund status: ${paypalRefundStatus}`);
                 return PaymentStatus.FAILED;
         }
     }
}