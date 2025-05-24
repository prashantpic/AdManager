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
import { StcPayClient } from '../../../integration/gateways/clients/stcpay/stcpay.client'; // Simulated Import
import { PaymentConfig } from '../../config/payment.config';

@Injectable()
export class StcPayAdapter implements IPaymentGateway {
   private readonly logger = new Logger(StcPayAdapter.name);
   private readonly webhookSecret: string;

  constructor(
    private readonly stcPayClient: StcPayClient,
    private readonly configService: ConfigService<PaymentConfig>,
  ) {
     this.webhookSecret = this.configService.get<string>('payment.stcpayWebhookSecret');
      if (!this.webhookSecret) {
        this.logger.warn('STCPay webhook secret is not configured. Webhook verification may fail.');
     }
  }

   async processPayment(paymentDetails: ProcessPaymentDto): Promise<PaymentResponseDto> {
     try {
       const stcPayChargeParams = {
           amount: paymentDetails.amount,
           currency: paymentDetails.currency,
           customer_identifier: paymentDetails.paymentMethodToken, // e.g., STCPay phone number or account ID
           merchant_ref_id: paymentDetails.orderId,
           description: paymentDetails.description,
       };

       this.logger.debug(`Calling STCPay client charge with params: ${JSON.stringify(stcPayChargeParams)}`);
       const chargeResult = await this.stcPayClient.charge(stcPayChargeParams);
       this.logger.log(`STCPay charge processed: ${chargeResult.id}, Status: ${chargeResult.status}`);
       const status = this.mapStcPayStatusToPaymentStatus(chargeResult.status);

       return {
           transactionId: '',
           gatewayTransactionId: chargeResult.id,
           status: status,
           message: chargeResult.message || 'STCPay payment processed',
           gatewayResponse: chargeResult,
       };
     } catch (error) {
       this.logger.error(`STCPay payment processing failed: ${error.message}`, error.stack);
       const gatewayError = error.response?.data || error;
       throw new PaymentGatewayIntegrationException(GatewayIdentifier.STCPAY, `Error processing STCPay payment: ${error.message}`, gatewayError, error);
     }
   }

   async refundPayment(refundDetails: RefundPaymentDto): Promise<PaymentResponseDto> {
     try {
       const stcPayRefundParams = {
           transaction_id: refundDetails.gatewayTransactionId,
           amount: refundDetails.amount,
           reason: refundDetails.reason,
       };

       this.logger.debug(`Calling STCPay client refund for transaction ID ${refundDetails.gatewayTransactionId}`);
       const refundResult = await this.stcPayClient.refund(stcPayRefundParams);
       this.logger.log(`STCPay refund processed: ${refundResult.id}, Status: ${refundResult.status}`);
       const status = this.mapStcPayRefundStatusToPaymentStatus(refundResult.status);

       return {
           transactionId: '',
           gatewayTransactionId: refundResult.id,
           status: status,
           message: refundResult.message || 'STCPay refund processed',
           gatewayResponse: refundResult,
       };
     } catch (error) {
       this.logger.error(`STCPay refund failed: ${error.message}`, error.stack);
       const gatewayError = error.response?.data || error;
       throw new RefundProcessingException(`Error processing STCPay refund: ${error.message}`, gatewayError);
     }
   }

    async createRecurringPayment(subscriptionDetails: CreateRecurringPaymentDto): Promise<RecurringPaymentDetailsDto> {
       this.logger.warn('STCPay recurring payment setup is a simulation of mandate/consent storage for internal scheduling.');
       if (!this.stcPayClient.supportsRecurringMandates) {
            throw new SubscriptionManagementErrorException(GatewayIdentifier.STCPAY, 'STCPay client does not support recurring payment mandates.');
       }
       try {
            // Simulate getting a customer consent reference
            const customerConsentReference = await this.stcPayClient.requestRecurringMandate(
                subscriptionDetails.paymentMethodToken, // Customer STCPay identifier
                subscriptionDetails.merchantId, // Our merchant ID
                // Other details for mandate scope based on plan
            );
            const internalSubscriptionId = `stcpay_sub_${subscriptionDetails.merchantId}_${subscriptionDetails.customerId}_${Date.now()}`;
            this.logger.log(`Simulating STCPay recurring setup: consent ref ${customerConsentReference}, internal ID ${internalSubscriptionId}.`);
            return {
                gatewaySubscriptionId: internalSubscriptionId,
                status: 'ACTIVE', // Internally managed, or PENDING_CONSENT
                currentPeriodStart: new Date(),
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Example
                planDetails: {
                    consentReference: customerConsentReference,
                    internalPlanId: subscriptionDetails.planId,
                    amount: subscriptionDetails.amount,
                    currency: subscriptionDetails.currency,
                    interval: subscriptionDetails.interval,
                    intervalCount: subscriptionDetails.intervalCount,
                },
            };
       } catch (error) {
           this.logger.error(`STCPay recurring payment setup (mandate) failed: ${error.message}`, error.stack);
           const gatewayError = error.response?.data || error;
           throw new SubscriptionManagementErrorException(GatewayIdentifier.STCPAY, `Error setting up STCPay recurring payment: ${error.message}`, gatewayError, error);
       }
   }

    async getRecurringPaymentDetails(gatewaySubscriptionId: string): Promise<RecurringPaymentDetailsDto> {
       this.logger.warn('Retrieving STCPay recurring details involves internal lookup for ID:', gatewaySubscriptionId);
        try {
            // This requires an internal mechanism to store and retrieve these simulated subscriptions/mandates
            throw new Error(`Internal lookup for STCPay subscription/mandate ${gatewaySubscriptionId} not implemented.`);
        } catch (error) {
            this.logger.error(`STCPay recurring payment details retrieval failed for ID ${gatewaySubscriptionId}: ${error.message}`, error.stack);
            throw new SubscriptionManagementErrorException(GatewayIdentifier.STCPAY, `Error retrieving STCPay recurring payment details: ${error.message}`, error, error);
        }
    }

   async cancelRecurringPayment(cancelDetails: CancelRecurringPaymentDto): Promise<void> {
       this.logger.warn('Canceling STCPay recurring payment simulation for ID:', cancelDetails.gatewaySubscriptionId);
        try {
             // This requires an internal mechanism to mark the simulated subscription/mandate as canceled.
             // If the mandate itself needs to be revoked, call stcPayClient.revokeMandate if available.
             this.logger.log(`Simulated cancellation of internal STCPay subscription/mandate ID: ${cancelDetails.gatewaySubscriptionId}`);
        } catch (error) {
            this.logger.error(`STCPay recurring payment cancellation failed for ID ${cancelDetails.gatewaySubscriptionId}: ${error.message}`, error.stack);
            throw new SubscriptionManagementErrorException(GatewayIdentifier.STCPAY, `Error canceling STCPay recurring payment: ${error.message}`, error, error);
        }
   }

   verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
       this.logger.warn('STCPay webhook signature verification logic needs specific implementation based on provider.');
       if (!signature || !secret) {
            this.logger.error('Missing signature or secret for STCPay webhook verification.');
            return false;
        }
       // Placeholder: Actual verification depends on the STCPay gateway provider's mechanism
       const expectedSignature = this.stcPayClient.calculateSignature(payload, secret); // Simulated
       if (signature === expectedSignature) {
            this.logger.debug('STCPay webhook signature (simulated) verified successfully.');
            return true;
       }
       this.logger.warn('STCPay webhook signature (simulated) verification failed.');
       return false;
   }

   parseWebhookEvent(rawPayload: any): WebhookEventDto {
        const event = rawPayload as any;
        this.logger.debug(`Parsing STCPay webhook event... Event Type: ${event.type || 'N/A'}`);
        const eventType = event.event_type || event.type || 'unknown_stcpay_event';
        const payloadData = event.data || event;
        const receivedTime = event.timestamp ? new Date(event.timestamp) : new Date();

       return {
           gateway: GatewayIdentifier.STCPAY,
           eventType: eventType,
           payload: payloadData,
           receivedAt: receivedTime,
       };
   }

    private mapStcPayStatusToPaymentStatus(stcPayStatus: string): PaymentStatus {
        switch (stcPayStatus?.toUpperCase()) {
             case 'PENDING':
             case 'CREATED':
             case 'AUTHORIZED': // If STCPay has an auth step
                 return PaymentStatus.PENDING;
             case 'COMPLETED':
             case 'SUCCESS':
             case 'PAID':
             case 'SETTLED':
                 return PaymentStatus.SUCCESSFUL;
             case 'FAILED':
             case 'DECLINED':
             case 'CANCELLED': // Assuming gateway cancellation means failure from our perspective
                 return PaymentStatus.FAILED;
             default:
                 this.logger.warn(`Unknown or unmapped STCPay payment status: ${stcPayStatus}`);
                 return PaymentStatus.FAILED;
        }
    }

    private mapStcPayRefundStatusToPaymentStatus(stcPayRefundStatus: string): PaymentStatus {
         switch (stcPayRefundStatus?.toUpperCase()) {
             case 'PENDING':
                 return PaymentStatus.PENDING;
             case 'COMPLETED':
             case 'SUCCESS':
                 return PaymentStatus.SUCCESSFUL;
             case 'FAILED':
             case 'CANCELLED':
             default:
                 this.logger.warn(`Unknown or unmapped STCPay refund status: ${stcPayRefundStatus}`);
                 return PaymentStatus.FAILED;
         }
    }
}