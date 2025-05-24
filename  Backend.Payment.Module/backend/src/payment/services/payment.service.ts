import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentGatewayFactory } from '../gateways/payment-gateway.factory';
import { PaymentTransactionLogRepository } from '../persistence/repositories/payment-transaction-log.repository';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { WebhookEventDto } from '../dto/webhook-event.dto';
import { GatewayIdentifier, PaymentStatus, TransactionType } from '../constants/payment.constants';
import { PaymentProcessingException, RefundProcessingException } from '../exceptions/payment.exceptions';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for internal transaction ID


@Injectable()
export class PaymentService {
  private readonly logger: Logger;

  constructor(
    private readonly gatewayFactory: PaymentGatewayFactory,
    private readonly transactionLogRepository: PaymentTransactionLogRepository,
    private readonly configService: ConfigService, // From CoreModule
    // private readonly loggerService: CoreModule.LoggerService, // Assuming CoreModule provides a LoggerService or use Nest's built-in Logger
  ) {
     // If using CoreModule.LoggerService: this.logger = this.loggerService.getLogger(PaymentService.name);
     // If using Nest's built-in Logger:
     this.logger = new Logger(PaymentService.name);
  }

  /**
   * Processes a one-time merchant sale payment.
   * Logs the transaction attempt before and after processing.
   * @param paymentDetails - Details required to process the payment.
   * @param selectedGateway - The identifier of the gateway to use.
   * @returns Promise resolving to the payment transaction response.
   * @throws PaymentProcessingException on failure.
   */
  async processMerchantSale(
    paymentDetails: ProcessPaymentDto,
    selectedGateway: GatewayIdentifier,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Initiating payment processing for order ${paymentDetails.orderId} via ${selectedGateway}`);

    // Generate internal transaction ID
    const internalTransactionId = uuidv4();
    let transactionLog = await this.transactionLogRepository.createLog({
        id: internalTransactionId,
        merchantId: paymentDetails.merchantId,
        orderId: paymentDetails.orderId,
        gatewayIdentifier: selectedGateway,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: PaymentStatus.PENDING,
        transactionType: TransactionType.SALE,
        // Do NOT log sensitive paymentMethodToken here
        gatewayResponse: { description: paymentDetails.description }, // Log non-sensitive details
    });
    this.logger.debug(`Created pending transaction log: ${transactionLog.id}`);

    try {
      const gateway = this.gatewayFactory.getGateway(selectedGateway);
      // Pass the internal transaction ID to the adapter if it needs to be included in metadata
      const paymentResponse = await gateway.processPayment({
         ...paymentDetails,
          // Potentially add internalTransactionId to metadata for gateway reconciliation
          // metadata: { internalTransactionId: internalTransactionId } // Depends on adapter/gateway support
      });

      // Update the transaction log with the gateway response and final status
      transactionLog = await this.transactionLogRepository.updateLogStatus(
        transactionLog.id,
        paymentResponse.status,
        paymentResponse.gatewayResponse,
        paymentResponse.status === PaymentStatus.FAILED ? paymentResponse.message : undefined,
      );
      // Update the gatewayTransactionId in the log
      transactionLog.gatewayTransactionId = paymentResponse.gatewayTransactionId;
      await this.transactionLogRepository.save(transactionLog);

      this.logger.log(`Payment log ${transactionLog.id} updated to status: ${transactionLog.status}`);

      // Return the response DTO, ensuring it includes the internal ID
      return {
         transactionId: transactionLog.id,
         ...paymentResponse,
      };

    } catch (error) {
      this.logger.error(`Payment processing failed for transaction ${internalTransactionId}: ${error.message}`, error.stack);

      // Log the failure
      await this.transactionLogRepository.updateLogStatus(
          transactionLog.id,
          PaymentStatus.FAILED,
           error.originalError?.response?.data || { message: error.message }, // Log relevant gateway error response if available
           error.message, // Log the exception message
      );

      // Re-throw the specific exception
      if (error instanceof PaymentProcessingException) {
        throw error;
      }
      throw new PaymentProcessingException(`Payment processing failed: ${error.message}`, error);
    }
  }

  /**
   * Initiates a refund for a previously processed merchant sale.
   * Logs the refund attempt.
   * @param refundDetails - Details required to initiate the refund.
   * @param selectedGateway - The identifier of the gateway where the original transaction occurred.
   * @returns Promise resolving to the refund transaction response.
   * @throws RefundProcessingException on failure.
   */
  async refundMerchantSale(
    refundDetails: RefundPaymentDto,
    selectedGateway: GatewayIdentifier,
  ): Promise<PaymentResponseDto> {
      this.logger.log(`Initiating refund for gateway transaction ID ${refundDetails.gatewayTransactionId} via ${selectedGateway}`);

       // Optional: Look up original transaction log to get amount, currency, merchantId etc.
       const originalLog = await this.transactionLogRepository.findOne({
           where: { gatewayTransactionId: refundDetails.gatewayTransactionId, gatewayIdentifier: selectedGateway, transactionType: TransactionType.SALE }
       });

       if (!originalLog) {
           this.logger.error(`Original transaction log not found for gateway transaction ID ${refundDetails.gatewayTransactionId} on gateway ${selectedGateway}. Cannot process refund.`);
           throw new RefundProcessingException(`Original transaction not found for refund.`);
       }
       // Use original log's currency and potentially amount (if not provided for full refund)
       const refundAmount = refundDetails.amount ?? originalLog.amount;
       const currency = originalLog.currency;


       // Generate internal transaction ID for the refund attempt
       const internalRefundTransactionId = uuidv4();
        let refundTransactionLog = await this.transactionLogRepository.createLog({
            id: internalRefundTransactionId,
            merchantId: refundDetails.merchantId, // Should match originalLog.merchantId
            orderId: originalLog.orderId, // From original log
             gatewayTransactionId: refundDetails.gatewayTransactionId, // Link to original gateway txn
            gatewayIdentifier: selectedGateway,
            amount: refundAmount, // Store refund amount (positive, type indicates refund)
            currency: currency,
            status: PaymentStatus.PENDING, // Refund is pending initially
            transactionType: TransactionType.REFUND,
            gatewayResponse: { reason: refundDetails.reason }, // Log non-sensitive details
        });
         this.logger.debug(`Created pending refund transaction log: ${refundTransactionLog.id}`);


      try {
        const gateway = this.gatewayFactory.getGateway(selectedGateway);
        const refundResponse = await gateway.refundPayment({
            ...refundDetails,
            amount: refundAmount, // Ensure correct amount is passed
        });

         // Update the refund transaction log with the gateway response and final status
         refundTransactionLog = await this.transactionLogRepository.updateLogStatus(
            refundTransactionLog.id,
            refundResponse.status, // Status is from gateway (e.g., pending, completed, failed)
            refundResponse.gatewayResponse,
            refundResponse.status === PaymentStatus.FAILED ? refundResponse.message : undefined,
         );
         // Update the gatewayTransactionId (if refund has its own ID) in the log
         refundTransactionLog.gatewayTransactionId = refundResponse.gatewayTransactionId ?? refundTransactionLog.gatewayTransactionId; // Keep original if refund doesn't have new ID
         await this.transactionLogRepository.save(refundTransactionLog);

        this.logger.log(`Refund log ${refundTransactionLog.id} updated to status: ${refundTransactionLog.status}`);


         // Update the status of the original payment transaction log if refund is successful/completed
         if (refundResponse.status === PaymentStatus.SUCCESSFUL) {
             await this.transactionLogRepository.updateLogStatus(originalLog.id, PaymentStatus.REFUNDED);
             this.logger.log(`Original payment log ${originalLog.id} marked as REFUNDED.`);
         }


        return {
            transactionId: refundTransactionLog.id,
             ...refundResponse,
         };

      } catch (error) {
        this.logger.error(`Refund processing failed for gateway transaction ID ${refundDetails.gatewayTransactionId}: ${error.message}`, error.stack);

         // Log the failure for the refund attempt
         await this.transactionLogRepository.updateLogStatus(
             refundTransactionLog.id,
             PaymentStatus.FAILED,
              error.originalError?.response?.data || { message: error.message },
             error.message,
         );

        if (error instanceof RefundProcessingException) {
            throw error;
        }
        throw new RefundProcessingException(`Refund processing failed: ${error.message}`, error);
      }
  }

  /**
   * Handles incoming webhook events related to one-time payments (e.g., charge.succeeded, charge.failed).
   * Updates transaction logs and potentially triggers downstream processes (e.g., order status update).
   * @param event - The standardized webhook event DTO.
   * @returns Promise resolving when the event processing is complete.
   */
  async handleWebhookPaymentEvent(event: WebhookEventDto): Promise<void> {
    this.logger.log(`Handling payment webhook event: ${event.gateway} - ${event.eventType}`);
    this.logger.debug(`Webhook payload: ${JSON.stringify(event.payload)}`);

    try {
        let gatewayTransactionId: string | undefined;
        let internalOrderId: string | undefined;
        let currentStatus: PaymentStatus | undefined;
        let errorMessage: string | undefined;
        let amount: number | undefined;
        let currency: string | undefined;
        let internalMerchantId: string | undefined;
        let gatewaySubscriptionId: string | undefined;


        // Map webhook payload to internal fields and status
        // Example mapping based on Stripe 'charge.succeeded' or 'charge.failed'
        if (event.gateway === GatewayIdentifier.STRIPE) {
            const charge = event.payload as any; // Stripe charge object
            gatewayTransactionId = charge.id;
            internalOrderId = charge.metadata?.orderId;
            internalMerchantId = charge.metadata?.merchantId;
            gatewaySubscriptionId = charge.invoice ? (await this.gatewayFactory.getGateway(GatewayIdentifier.STRIPE).parseWebhookEvent(charge.invoice as any)).payload.subscription : undefined; // If charge is related to an invoice/subscription
            amount = charge.amount / 100; // Stripe amount is in cents
            currency = charge.currency;


             if (event.eventType === 'charge.succeeded') {
                 currentStatus = PaymentStatus.SUCCESSFUL;
             } else if (event.eventType === 'charge.failed') {
                 currentStatus = PaymentStatus.FAILED;
                 errorMessage = charge.failure_message || 'Charge failed';
             } else if (event.eventType === 'charge.refunded') {
                  currentStatus = PaymentStatus.REFUNDED;
             } else {
                 this.logger.debug(`Ignoring Stripe webhook event type ${event.eventType} for payment handling.`);
                 return;
             }
        }
         // Example mapping based on PayPal capture events
         else if (event.gateway === GatewayIdentifier.PAYPAL) {
             const capture = event.payload as any; // PayPal capture object
             gatewayTransactionId = capture.id; // PayPal Capture ID
             // PayPal custom_id might store orderId or merchantId_orderId
             internalOrderId = capture.custom_id; // Or parse from it
             internalMerchantId = undefined; // Derive from custom_id or invoice details if possible
             amount = parseFloat(capture.amount?.value);
             currency = capture.amount?.currency_code;
             gatewaySubscriptionId = capture.billing_agreement_id; // If part of a subscription

             if (event.eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                 currentStatus = PaymentStatus.SUCCESSFUL;
             } else if (event.eventType === 'PAYMENT.CAPTURE.DENIED') {
                 currentStatus = PaymentStatus.FAILED;
                  errorMessage = capture.reason_code || 'Payment capture denied';
             } else if (event.eventType === 'PAYMENT.CAPTURE.REFUNDED') {
                 currentStatus = PaymentStatus.REFUNDED;
             } else {
                  this.logger.debug(`Ignoring PayPal webhook event type ${event.eventType} for payment handling.`);
                 return;
             }
         }
         // Add Mada/STCPay mapping...
         else {
             this.logger.warn(`Unsupported gateway ${event.gateway} for payment webhook handling.`);
             return;
         }

        if (!gatewayTransactionId) {
             this.logger.warn(`Could not identify gateway transaction ID from webhook payload for event type ${event.eventType}. Payload: ${JSON.stringify(event.payload)}`);
             return;
        }
        if (currentStatus === undefined) {
            this.logger.warn(`Could not determine payment status from webhook event type ${event.eventType}. Payload: ${JSON.stringify(event.payload)}`);
            return;
        }


        const transactionLog = await this.transactionLogRepository.findOne({
             where: {
                 gatewayTransactionId: gatewayTransactionId,
                 gatewayIdentifier: event.gateway,
             },
             order: { createdAt: 'DESC' }
         });

        if (transactionLog) {
            if (transactionLog.status === PaymentStatus.SUCCESSFUL && currentStatus === PaymentStatus.SUCCESSFUL) {
                 this.logger.debug(`Log ${transactionLog.id} already marked SUCCESSFUL. Ignoring redundant webhook event.`);
                 return;
            }
            if (transactionLog.status === PaymentStatus.REFUNDED && currentStatus === PaymentStatus.REFUNDED) {
                this.logger.debug(`Log ${transactionLog.id} already marked REFUNDED. Ignoring redundant webhook event.`);
                return;
           }

            this.logger.log(`Updating existing transaction log ${transactionLog.id} for webhook event ${event.eventType} to status ${currentStatus}`);
            await this.transactionLogRepository.updateLogStatus(
                 transactionLog.id,
                 currentStatus,
                 event.payload,
                 errorMessage,
             );
        } else {
            this.logger.warn(`No existing transaction log found for gateway transaction ID ${gatewayTransactionId}. Creating a new log entry for webhook event.`);

            if (!amount || !currency || !internalMerchantId) { // Merchant ID is crucial
                  this.logger.error(`Cannot create a full transaction log from webhook event ${event.eventType} without sufficient data (amount, currency, merchantId). Payload: ${JSON.stringify(event.payload)}`);
                   return;
             }

             await this.transactionLogRepository.createLog({
                id: uuidv4(),
                merchantId: internalMerchantId,
                orderId: internalOrderId,
                gatewaySubscriptionId: gatewaySubscriptionId,
                gatewayTransactionId: gatewayTransactionId,
                gatewayIdentifier: event.gateway,
                amount: amount,
                currency: currency,
                status: currentStatus,
                transactionType: TransactionType.CHARGE,
                errorMessage: errorMessage,
                gatewayResponse: event.payload,
             });
             this.logger.log(`Created new transaction log from webhook for gateway transaction ID ${gatewayTransactionId}.`);
        }
         // Trigger downstream actions (e.g., notify OrderModule)
         // await this.downstreamService.notifyPaymentStatusUpdate(...)

    } catch (error) {
        this.logger.error(`Failed to handle payment webhook event ${event.gateway} - ${event.eventType}: ${error.message}`, error.stack);
    }
  }
}