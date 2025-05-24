import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentGatewayFactory } from '../gateways/payment-gateway.factory';
import { PaymentTransactionLogRepository } from '../persistence/repositories/payment-transaction-log.repository';
import { IDunningStrategy } from '../strategies/dunning/dunning.strategy.interface';
import { CreateRecurringPaymentDto } from '../dto/create-recurring-payment.dto';
import { RecurringPaymentDetailsDto } from '../dto/recurring-payment-details.dto';
import { CancelRecurringPaymentDto } from '../dto/cancel-recurring-payment.dto';
import { WebhookEventDto } from '../dto/webhook-event.dto';
import { GatewayIdentifier, PaymentStatus, RecurringPaymentEvent, TransactionType } from '../constants/payment.constants';
import {
    RecurringPaymentException,
    SubscriptionManagementErrorException,
    DunningProcessException
} from '../exceptions/payment.exceptions';
import { ConfigService } from '@nestjs/config';
import { PaymentConfig } from '../config/payment.config';
import { DunningParametersDto } from '../dto/dunning-parameters.dto';
import { v4 as uuidv4 } from 'uuid'; // For internal transaction IDs

// Assume NotificationService is provided by NotificationModule (optional dependency)
// import { NotificationService } from '../../../notification/services/notification.service'; // Simulated Import

@Injectable()
export class RecurringBillingService {
   private readonly logger: Logger;
   private readonly config: PaymentConfig;

    constructor(
        private readonly gatewayFactory: PaymentGatewayFactory,
        private readonly transactionLogRepository: PaymentTransactionLogRepository,
        private readonly dunningStrategy: IDunningStrategy, // Inject the chosen dunning strategy
        private readonly configService: ConfigService<PaymentConfig>, // From CoreModule
        // private readonly notificationService: NotificationService, // Injected from NotificationModule (Optional)
       // private readonly loggerService: CoreModule.LoggerService, // Assuming CoreModule provides a LoggerService
    ) {
         this.logger = new Logger(RecurringBillingService.name);
         this.config = this.configService.get<PaymentConfig>('payment');
         if (!this.config.enableRecurringBillingForMerchantProducts) {
             this.logger.warn('Recurring billing for merchant products is disabled per configuration.');
         }
    }

    async setupRecurringPayment(
        details: CreateRecurringPaymentDto,
        selectedGateway: GatewayIdentifier,
    ): Promise<RecurringPaymentDetailsDto> {
        if (!this.config.enableRecurringBillingForMerchantProducts) {
             throw new RecurringPaymentException('Recurring billing is currently disabled.');
        }
        this.logger.log(`Setting up recurring payment for merchant ${details.merchantId}, customer ${details.customerId} via ${selectedGateway}`);

        try {
            const gateway = this.gatewayFactory.getGateway(selectedGateway);
            const subscriptionDetails = await gateway.createRecurringPayment(details);
            this.logger.log(`Recurring payment setup successful for subscription ID: ${subscriptionDetails.gatewaySubscriptionId}`);

            // Log initial setup (if first payment is not immediate or handled by separate webhook)
            // Or log based on initial payment attempt if gateway.createRecurringPayment includes first charge
            // For now, assume webhooks will cover payment logs.
            // If setup itself is a billable event (e.g. setup fee), log it.

            // await this.notificationService.sendSubscriptionSetupNotification(...) // Optional

            return subscriptionDetails;

        } catch (error) {
            this.logger.error(`Failed to setup recurring payment via ${selectedGateway}: ${error.message}`, error.stack);
             if (error instanceof RecurringPaymentException) throw error;
             throw new SubscriptionManagementErrorException(selectedGateway.toString(), `Setup failed: ${error.message}`, error, error);
        }
    }

    async cancelRecurringPaymentPlan(
        details: CancelRecurringPaymentDto,
        selectedGateway: GatewayIdentifier,
    ): Promise<void> {
        if (!this.config.enableRecurringBillingForMerchantProducts) {
             throw new RecurringPaymentException('Recurring billing is currently disabled.');
        }
        this.logger.log(`Canceling recurring payment plan ${details.gatewaySubscriptionId} via ${selectedGateway} for merchant ${details.merchantId}`);

        try {
            const gateway = this.gatewayFactory.getGateway(selectedGateway);
            await gateway.cancelRecurringPayment(details);
            this.logger.log(`Recurring payment cancellation requested for subscription ID: ${details.gatewaySubscriptionId}`);

            // Log cancellation event in transaction log
            await this.transactionLogRepository.createLog({
                id: uuidv4(),
                merchantId: details.merchantId,
                gatewaySubscriptionId: details.gatewaySubscriptionId,
                gatewayIdentifier: selectedGateway,
                amount: 0, // No amount for cancellation itself
                currency: 'N/A', // No currency for cancellation
                status: PaymentStatus.SUCCESSFUL, // Assuming cancellation request itself is successful
                transactionType: TransactionType.RECURRING_RENEWAL, // Using RENEWAL as a placeholder for a subscription lifecycle event type 'CANCELLED'
                gatewayResponse: { message: `Subscription ${details.gatewaySubscriptionId} cancelled.`},
            });

            // await this.notificationService.sendSubscriptionCancellationNotification(...) // Optional

        } catch (error) {
             this.logger.error(`Failed to cancel recurring payment plan ${details.gatewaySubscriptionId} via ${selectedGateway}: ${error.message}`, error.stack);
             if (error instanceof RecurringPaymentException) throw error;
             throw new SubscriptionManagementErrorException(selectedGateway.toString(), `Cancellation failed: ${error.message}`, error, error);
        }
    }

    async getRecurringPaymentPlanDetails(
        gatewaySubscriptionId: string,
        selectedGateway: GatewayIdentifier,
    ): Promise<RecurringPaymentDetailsDto> {
         if (!this.config.enableRecurringBillingForMerchantProducts) {
             throw new RecurringPaymentException('Recurring billing is currently disabled.');
        }
        this.logger.debug(`Retrieving recurring payment plan details for ${gatewaySubscriptionId} via ${selectedGateway}`);
        try {
            const gateway = this.gatewayFactory.getGateway(selectedGateway);
            const details = await gateway.getRecurringPaymentDetails(gatewaySubscriptionId);
            this.logger.debug(`Retrieved details for subscription ${gatewaySubscriptionId}. Status: ${details.status}`);
            return details;
        } catch (error) {
            this.logger.error(`Failed to retrieve recurring payment plan details for ${gatewaySubscriptionId} via ${selectedGateway}: ${error.message}`, error.stack);
             if (error instanceof RecurringPaymentException) throw error;
             throw new SubscriptionManagementErrorException(selectedGateway.toString(), `Retrieval failed: ${error.message}`, error, error);
        }
    }

    async processFailedRenewal(
        gatewaySubscriptionId: string,
        selectedGateway: GatewayIdentifier,
        dunningParams: DunningParametersDto, // Can be platform default or merchant-specific
    ): Promise<void> {
        if (!this.config.enableAutomatedDunningProcess) {
             this.logger.debug('Automated dunning is disabled. Skipping processFailedRenewal for', gatewaySubscriptionId);
             return;
        }

        this.logger.log(`Processing failed renewal for subscription ${gatewaySubscriptionId} via ${selectedGateway}`);

        try {
            const lastFailedAttempt = await this.transactionLogRepository.findLatestFailedBySubscriptionId(gatewaySubscriptionId);

            if (!lastFailedAttempt) {
                 const details = await this.getRecurringPaymentPlanDetails(gatewaySubscriptionId, selectedGateway);
                 // Map gateway status to something like 'isDueForPayment'
                 const isActuallyDue = details.status === 'past_due' || details.status === 'unpaid'; // Example status mapping
                 if (!isActuallyDue) {
                      this.logger.log(`Subscription ${gatewaySubscriptionId} is not in a failed/due state (${details.status}) according to gateway. Skipping dunning.`);
                      return;
                 }
                 this.logger.error(`Gateway confirms failed status for ${gatewaySubscriptionId}, but no local failed log found. Dunning cannot proceed without a base log.`);
                 throw new DunningProcessException(`No recent failed log found for subscription ${gatewaySubscriptionId} to initiate dunning.`);
            }

            await this.dunningStrategy.executeDunning(
                 gatewaySubscriptionId,
                 selectedGateway,
                 dunningParams,
                 lastFailedAttempt,
            );
            this.logger.log(`Dunning process executed for subscription ${gatewaySubscriptionId}.`);

        } catch (error) {
             this.logger.error(`Error in processFailedRenewal for ${gatewaySubscriptionId}: ${error.message}`, error.stack);
             if (!(error instanceof DunningProcessException)) {
                  throw new DunningProcessException(`Unexpected error during failed renewal processing for ${gatewaySubscriptionId}`, error);
             }
             throw error;
        }
    }

    async handleWebhookSubscriptionEvent(event: WebhookEventDto): Promise<void> {
        if (!this.config.enableRecurringBillingForMerchantProducts) {
             this.logger.debug('Recurring billing is disabled. Skipping subscription webhook handling for', event.gateway, event.eventType);
             return;
        }
        this.logger.log(`Handling subscription webhook event: ${event.gateway} - ${event.eventType}`);
        this.logger.debug(`Webhook payload: ${JSON.stringify(event.payload)}`);

        try {
            let gatewaySubscriptionId: string | undefined;
            let gatewayTransactionId: string | undefined;
            let internalMerchantId: string | undefined;
            let statusForLog: PaymentStatus | undefined;
            let transactionTypeForLog: TransactionType | undefined;
            let amountForLog: number | undefined;
            let currencyForLog: string | undefined;
            let errorMessageForLog: string | undefined;


            // Logic to extract key identifiers and map event to internal actions
            if (event.gateway === GatewayIdentifier.STRIPE) {
                const payload = event.payload as any;
                if (event.eventType.startsWith('customer.subscription.')) {
                    gatewaySubscriptionId = payload.id;
                    internalMerchantId = payload.metadata?.merchantId;
                    // Handle subscription status updates (created, updated, deleted, etc.)
                    // This might involve updating a separate MerchantSubscription entity, not just PaymentTransactionLog
                    this.logger.log(`Stripe subscription ${gatewaySubscriptionId} event: ${event.eventType}, status: ${payload.status}`);
                    // if (event.eventType === 'customer.subscription.deleted') { /* Log cancellation? */ }
                    return; // Return early if only updating subscription meta, not a payment event
                } else if (event.eventType.startsWith('invoice.')) {
                    const invoice = payload;
                    gatewaySubscriptionId = invoice.subscription;
                    gatewayTransactionId = invoice.charge;
                    internalMerchantId = invoice.metadata?.merchantId || invoice.customer_details?.metadata?.merchantId || invoice.customer?.metadata?.merchantId;
                    amountForLog = invoice.amount_paid !== null ? invoice.amount_paid / 100 : invoice.amount_due / 100;
                    currencyForLog = invoice.currency;

                    if (event.eventType === 'invoice.payment_succeeded') {
                        statusForLog = PaymentStatus.SUCCESSFUL;
                        transactionTypeForLog = TransactionType.RECURRING_RENEWAL;
                    } else if (event.eventType === 'invoice.payment_failed') {
                        statusForLog = PaymentStatus.FAILED;
                        transactionTypeForLog = TransactionType.RECURRING_RENEWAL;
                        errorMessageForLog = invoice.last_payment_error?.message || 'Invoice payment failed';
                    } else {
                        this.logger.debug(`Ignoring Stripe invoice event type ${event.eventType}.`);
                        return;
                    }
                } else {
                    this.logger.debug(`Ignoring Stripe webhook event type ${event.eventType} for subscription handling.`);
                    return;
                }
            } else if (event.gateway === GatewayIdentifier.PAYPAL) {
                const payload = event.payload as any;
                if (event.eventType.startsWith('BILLING.SUBSCRIPTION.')) {
                    gatewaySubscriptionId = payload.id;
                    // internalMerchantId derived from custom_id or similar if set during creation
                    this.logger.log(`PayPal subscription ${gatewaySubscriptionId} event: ${event.eventType}, status: ${payload.status}`);
                    // if (event.eventType === 'BILLING.SUBSCRIPTION.CANCELLED') { /* Log cancellation? */ }
                    return;
                } else if (event.eventType.startsWith('PAYMENT.SALE.')) { // Often linked to subscriptions
                    const sale = payload;
                    gatewayTransactionId = sale.id;
                    gatewaySubscriptionId = sale.billing_agreement_id; // PayPal's link to subscription
                    // internalMerchantId from sale custom_id or invoice_id if available
                    amountForLog = parseFloat(sale.amount?.total || sale.amount?.value);
                    currencyForLog = sale.amount?.currency_code || sale.amount?.currency;

                    if (event.eventType === 'PAYMENT.SALE.COMPLETED') {
                        statusForLog = PaymentStatus.SUCCESSFUL;
                        transactionTypeForLog = TransactionType.RECURRING_RENEWAL;
                    } else if (event.eventType === 'PAYMENT.SALE.DENIED') {
                        statusForLog = PaymentStatus.FAILED;
                        transactionTypeForLog = TransactionType.RECURRING_RENEWAL;
                        errorMessageForLog = sale.reason_code || 'PayPal sale denied';
                    } else {
                        this.logger.debug(`Ignoring PayPal sale event type ${event.eventType}.`);
                        return;
                    }
                } else {
                     this.logger.debug(`Ignoring PayPal webhook event type ${event.eventType} for subscription handling.`);
                     return;
                }
            }
            // Add Mada/STCPay mapping if they send subscription-related webhooks
            else {
                this.logger.warn(`Unsupported gateway ${event.gateway} for subscription webhook handling.`);
                return;
            }

            if (!gatewaySubscriptionId || statusForLog === undefined || transactionTypeForLog === undefined) {
                 this.logger.warn(`Insufficient data to process subscription webhook event. SubID: ${gatewaySubscriptionId}, Status: ${statusForLog}, Type: ${transactionTypeForLog}`);
                 return;
            }

            // Log the transaction
            await this.logRecurringTransactionFromWebhook(
                gatewaySubscriptionId,
                event.gateway,
                gatewayTransactionId,
                amountForLog ?? 0,
                currencyForLog ?? 'N/A',
                statusForLog,
                transactionTypeForLog,
                internalMerchantId,
                event.payload,
                errorMessageForLog,
            );

            // If payment failed, trigger dunning
            if (statusForLog === PaymentStatus.FAILED && internalMerchantId) {
                const dunningParams = this.getDefaultDunningParameters(); // Fetch appropriate dunning params
                this.logger.log(`Triggering dunning process for failed renewal of subscription ${gatewaySubscriptionId} due to webhook.`);
                // Ensure that processFailedRenewal itself doesn't cause an infinite loop with webhook triggers.
                // It should check elapsed time or number of attempts.
                await this.processFailedRenewal(gatewaySubscriptionId, event.gateway, dunningParams);
            }
            // else if (statusForLog === PaymentStatus.SUCCESSFUL) {
            //    await this.notificationService.sendRecurringPaymentSuccessNotification(...); // Optional
            // }

        } catch (error) {
            this.logger.error(`Failed to handle subscription webhook event ${event.gateway} - ${event.eventType}: ${error.message}`, error.stack);
        }
    }

    private async logRecurringTransactionFromWebhook(
        gatewaySubscriptionId: string,
        gatewayIdentifier: GatewayIdentifier,
        gatewayTransactionId: string | undefined,
        amount: number,
        currency: string,
        status: PaymentStatus,
        transactionType: TransactionType,
        merchantId: string | undefined,
        gatewayResponse: any,
        errorMessage?: string,
    ): Promise<void> {
        if (!merchantId) {
            this.logger.error(`Cannot log recurring transaction: Merchant ID is missing for subscription ${gatewaySubscriptionId}.`);
            // Attempt to find merchantId from existing logs for this subscription?
            const existingSubLogs = await this.transactionLogRepository.findByGatewaySubscriptionId(gatewaySubscriptionId);
            if (existingSubLogs.length > 0 && existingSubLogs[0].merchantId) {
                merchantId = existingSubLogs[0].merchantId;
                this.logger.warn(`Recovered merchantId ${merchantId} for subscription ${gatewaySubscriptionId} from previous logs.`);
            } else {
                this.logger.error(`Critical: MerchantId still missing for subscription ${gatewaySubscriptionId}. Log will be incomplete or skipped.`);
                // Depending on strictness, either log with null/undefined merchantId or skip logging.
                // For now, log with what we have.
            }
        }


        let existingLog = null;
        if (gatewayTransactionId) { // If webhook provides a specific transaction ID for this payment attempt
             existingLog = await this.transactionLogRepository.findOne({
                 where: { gatewayTransactionId, gatewayIdentifier }
             });
        } else { // If no specific transaction ID, try to find a recent pending log for this subscription
            existingLog = await this.transactionLogRepository.findOne({
                where: { gatewaySubscriptionId, gatewayIdentifier, status: PaymentStatus.PENDING, transactionType },
                order: { createdAt: 'DESC' }
            });
        }


        if (existingLog) {
            if (existingLog.status === PaymentStatus.SUCCESSFUL && status === PaymentStatus.SUCCESSFUL) {
                this.logger.debug(`Log ${existingLog.id} for sub ${gatewaySubscriptionId} already SUCCESSFUL. Ignoring redundant webhook.`);
                return;
            }
            this.logger.debug(`Updating existing recurring log ${existingLog.id} for sub ${gatewaySubscriptionId} to status ${status}`);
            await this.transactionLogRepository.updateLogStatus(
                existingLog.id,
                status,
                gatewayResponse,
                errorMessage,
            );
        } else {
            this.logger.debug(`Creating new recurring log for sub ${gatewaySubscriptionId} with status ${status}`);
            await this.transactionLogRepository.createLog({
                id: uuidv4(),
                merchantId: merchantId,
                gatewaySubscriptionId: gatewaySubscriptionId,
                gatewayTransactionId: gatewayTransactionId,
                gatewayIdentifier: gatewayIdentifier,
                amount: amount,
                currency: currency,
                status: status,
                transactionType: transactionType,
                errorMessage: errorMessage,
                gatewayResponse: gatewayResponse,
            });
        }
    }

     private getDefaultDunningParameters(): DunningParametersDto {
          return {
               maxRetries: this.config.defaultDunningAttempts,
               retryIntervalsDays: this.config.defaultDunningIntervalDays,
               notifyCustomerOnFailure: true,
               finalActionOnExhaustedRetries: 'cancel_subscription',
          };
     }
}