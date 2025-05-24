import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { IDunningStrategy } from './dunning.strategy.interface';
import { GatewayIdentifier, PaymentStatus, TransactionType } from '../../constants/payment.constants';
import { DunningParametersDto } from '../../dto/dunning-parameters.dto';
import { PaymentTransactionLog } from '../../persistence/entities/payment-transaction-log.entity';
import { PaymentGatewayFactory } from '../../gateways/payment-gateway.factory';
import { PaymentTransactionLogRepository } from '../../persistence/repositories/payment-transaction-log.repository';
import { DunningProcessException, PaymentGatewayIntegrationException } from '../../exceptions/payment.exceptions';
import { ConfigService } from '@nestjs/config';
import { PaymentConfig } from '../../config/payment.config';
import { PaymentResponseDto } from '../../dto/payment-response.dto';
// Assume NotificationService is provided by NotificationModule
// import { NotificationService } from '../../../notification/services/notification.service'; // Simulated Import

@Injectable()
export class DefaultDunningStrategy implements IDunningStrategy {
    private readonly logger = new Logger(DefaultDunningStrategy.name);
    private readonly config: PaymentConfig;

    constructor(
        private readonly gatewayFactory: PaymentGatewayFactory,
        private readonly transactionLogRepository: PaymentTransactionLogRepository,
        private readonly configService: ConfigService, // From CoreModule
        // private readonly notificationService: NotificationService, // Injected from NotificationModule (Optional)
    ) {
         this.config = this.configService.get<PaymentConfig>('payment');
         if (!this.config.enableAutomatedDunningProcess) {
              this.logger.warn('Automated dunning process is disabled per configuration.');
         }
    }

    async executeDunning(
        gatewaySubscriptionId: string,
        gatewayIdentifier: GatewayIdentifier,
        dunningParams: DunningParametersDto, // Could override config defaults
        lastPaymentAttempt: PaymentTransactionLog,
    ): Promise<void> {
        if (!this.config.enableAutomatedDunningProcess) {
            this.logger.debug('Automated dunning is disabled. Skipping dunning for subscription:', gatewaySubscriptionId);
            return;
        }

        this.logger.log(`Executing dunning for subscription ${gatewaySubscriptionId} via ${gatewayIdentifier}`);

        try {
            // 1. Determine retry count and intervals based on last attempt and dunningParams
            const failedAttempts = await this.countFailedDunningAttempts(gatewaySubscriptionId);
            const nextAttemptIndex = failedAttempts;

            if (nextAttemptIndex >= dunningParams.maxRetries) {
                this.logger.warn(`Dunning retries exhausted for subscription ${gatewaySubscriptionId}. Taking final action.`);
                await this.handleExhaustedRetries(gatewaySubscriptionId, gatewayIdentifier, dunningParams, lastPaymentAttempt.merchantId);
                return;
            }

            const intervalDays = dunningParams.retryIntervalsDays[nextAttemptIndex];
            if (intervalDays === undefined) {
                 this.logger.warn(`Dunning interval not defined for attempt ${nextAttemptIndex + 1} for subscription ${gatewaySubscriptionId}. Taking final action.`);
                 await this.handleExhaustedRetries(gatewaySubscriptionId, gatewayIdentifier, dunningParams, lastPaymentAttempt.merchantId);
                 return;
            }

            const timeSinceLastAttempt = Date.now() - lastPaymentAttempt.createdAt.getTime();
            const requiredIntervalMillis = intervalDays * 24 * 60 * 60 * 1000;

            if (timeSinceLastAttempt < requiredIntervalMillis) {
                this.logger.debug(`Not enough time elapsed for next dunning attempt (${nextAttemptIndex + 1}) for subscription ${gatewaySubscriptionId}. Skipping for now.`);
                // Schedule next check/attempt if using a job scheduler
                return;
            }

            this.logger.log(`Attempting dunning retry ${nextAttemptIndex + 1}/${dunningParams.maxRetries} for subscription ${gatewaySubscriptionId}.`);

            // 2. Attempt payment retry via gateway
            const gateway = this.gatewayFactory.getGateway(gatewayIdentifier);


            try {
                 // This is a simplified assumption. Gateway adapters might need a dedicated 'retrySubscriptionPayment' method.
                 // Or, for gateways managing subscriptions, retrieving the subscription might trigger the retry if overdue.
                 // For non-subscription gateways (Mada/STCPay simulation), we would initiate a new 'charge' using the saved token/mandate.
                 // The dunning strategy needs a way to tell the gateway "try charging this subscription again".
                 // For now, we assume adapters might have a generic way or this needs a new interface method.
                 // Let's assume for now, we fetch the subscription details to see if it is still active and if we can retry.
                 // And if it's Mada/STCPay like, we will use their token to call processPayment.

                 this.logger.warn('Dunning retry payment attempt logic needs concrete implementation per gateway adapter.');
                 // A more concrete approach:
                 // 1. Get subscription details from gateway.
                 // 2. If gateway handles retries (e.g., Stripe's 'past_due' status leads to auto-retry), then this step might just be about logging/monitoring.
                 // 3. If gateway requires explicit retry (e.g. PayPal 'retry_payment' on subscription, or for tokenized payments like Mada/STCPay), then call that method.
                 // This is a placeholder to simulate the retry.

                 let retryResponse: PaymentResponseDto;
                 let errorMessage: string | undefined;
                 const simulateRetrySuccess = Math.random() > 0.5; // 50% chance of success for simulation

                 if (simulateRetrySuccess) {
                     retryResponse = {
                         transactionId: 'internal-retry-' + Date.now(), // Placeholder
                         gatewayTransactionId: 'gateway-retry-' + Date.now(), // Placeholder
                         status: PaymentStatus.SUCCESSFUL,
                         message: 'Simulated dunning retry successful',
                         gatewayResponse: { detail: 'Retry was successful via simulation.' }
                     };
                     this.logger.log(`Dunning retry successful for subscription ${gatewaySubscriptionId}`);
                 } else {
                     errorMessage = 'Simulated dunning retry failure.';
                     retryResponse = {
                         transactionId: 'internal-retry-' + Date.now(), // Placeholder
                         gatewayTransactionId: 'gateway-retry-failed-' + Date.now(), // Placeholder
                         status: PaymentStatus.FAILED,
                         message: errorMessage,
                         gatewayResponse: { detail: 'Retry failed via simulation.' }
                     };
                     this.logger.warn(`Dunning retry failed for subscription ${gatewaySubscriptionId}: ${errorMessage}`);
                 }


                 // 3. Log the attempt
                 const newLog = await this.transactionLogRepository.createLog({
                      merchantId: lastPaymentAttempt.merchantId,
                      orderId: lastPaymentAttempt.orderId, // if applicable
                      gatewaySubscriptionId: gatewaySubscriptionId,
                      gatewayIdentifier: gatewayIdentifier,
                      amount: lastPaymentAttempt.amount, // Assuming same amount
                      currency: lastPaymentAttempt.currency, // Assuming same currency
                      status: retryResponse.status,
                      transactionType: TransactionType.RECURRING_RETRY,
                      gatewayTransactionId: retryResponse.gatewayTransactionId,
                      errorMessage: retryResponse.status === PaymentStatus.FAILED ? retryResponse.message : undefined,
                      gatewayResponse: retryResponse.gatewayResponse,
                 });
                this.logger.log(`Logged dunning retry attempt ${newLog.id} with status ${newLog.status}`);


                 // 4. Handle outcome
                 if (retryResponse.status === PaymentStatus.SUCCESSFUL) {
                     this.logger.log(`Subscription ${gatewaySubscriptionId} recovered via dunning.`);
                     // if (dunningParams.notifyCustomerOnFailure && this.notificationService) {
                     //    await this.notificationService.sendSubscriptionRecoveredNotification(lastPaymentAttempt.merchantId, gatewaySubscriptionId);
                     // }
                 } else {
                     this.logger.warn(`Dunning attempt ${nextAttemptIndex + 1} failed for subscription ${gatewaySubscriptionId}.`);
                     // if (dunningParams.notifyCustomerOnFailure && this.notificationService) {
                     //    await this.notificationService.sendDunningAttemptFailedNotification(lastPaymentAttempt.merchantId, gatewaySubscriptionId, nextAttemptIndex + 1);
                     // }
                 }


            } catch (gatewayError) {
                 this.logger.error(`Gateway error during dunning retry for subscription ${gatewaySubscriptionId}: ${gatewayError.message}`, gatewayError.stack);
                 await this.transactionLogRepository.createLog({
                      merchantId: lastPaymentAttempt.merchantId,
                      orderId: lastPaymentAttempt.orderId,
                      gatewaySubscriptionId: gatewaySubscriptionId,
                      gatewayIdentifier: gatewayIdentifier,
                      amount: lastPaymentAttempt.amount,
                      currency: lastPaymentAttempt.currency,
                      status: PaymentStatus.FAILED,
                      transactionType: TransactionType.RECURRING_RETRY,
                      errorMessage: `Gateway integration error during dunning: ${gatewayError.message}`,
                      gatewayResponse: gatewayError.response?.data || { message: gatewayError.message },
                 });
                 throw new DunningProcessException(`Failed gateway interaction during dunning for ${gatewaySubscriptionId}`, gatewayError);
            }


        } catch (error) {
            this.logger.error(`Error during dunning process for subscription ${gatewaySubscriptionId}: ${error.message}`, error.stack);
            if (!(error instanceof DunningProcessException)) {
                 throw new DunningProcessException(`An unexpected error occurred during dunning for ${gatewaySubscriptionId}`, error);
            }
            throw error;
        }
    }

     private async countFailedDunningAttempts(gatewaySubscriptionId: string): Promise<number> {
         const logs = await this.transactionLogRepository.find({
             where: { gatewaySubscriptionId: gatewaySubscriptionId },
             order: { createdAt: 'ASC' }, // Order by oldest first to count consecutive failures
         });

         let consecutiveFailures = 0;
         for (const log of logs) {
             if (log.transactionType === TransactionType.RECURRING_RENEWAL || log.transactionType === TransactionType.RECURRING_RETRY) {
                 if (log.status === PaymentStatus.FAILED) {
                     consecutiveFailures++;
                 } else if (log.status === PaymentStatus.SUCCESSFUL) {
                     consecutiveFailures = 0; // Reset on success
                 }
             }
         }
         this.logger.debug(`Counted ${consecutiveFailures} consecutive failed dunning/renewal attempts for ${gatewaySubscriptionId}`);
         return consecutiveFailures;
     }

     private async handleExhaustedRetries(
         gatewaySubscriptionId: string,
         gatewayIdentifier: GatewayIdentifier,
         dunningParams: DunningParametersDto,
         merchantId: string, // Merchant ID is crucial for cancellation context
     ): Promise<void> {
        const finalAction = dunningParams.finalActionOnExhaustedRetries || 'cancel_subscription';

         this.logger.log(`Dunning retries exhausted for ${gatewaySubscriptionId}. Taking final action: ${finalAction}`);

         try {
             if (finalAction === 'cancel_subscription') {
                 const gateway = this.gatewayFactory.getGateway(gatewayIdentifier);
                 await gateway.cancelRecurringPayment({ gatewaySubscriptionId: gatewaySubscriptionId, merchantId: merchantId });
                 this.logger.log(`Subscription ${gatewaySubscriptionId} canceled at gateway due to exhausted dunning retries.`);
                 // if (this.notificationService) {
                 //    await this.notificationService.sendSubscriptionCancelledAfterDunningNotification(merchantId, gatewaySubscriptionId);
                 // }
             } else if (finalAction === 'mark_unpaid') {
                 this.logger.log(`Marking subscription ${gatewaySubscriptionId} as unpaid due to exhausted dunning retries.`);
                 // This would typically involve updating an internal record for the subscription status
                 // (e.g., in a MerchantSubscription entity)
                 // if (this.notificationService) {
                 //    await this.notificationService.sendSubscriptionMarkedUnpaidNotification(merchantId, gatewaySubscriptionId);
                 // }
             } else {
                 this.logger.error(`Unknown final dunning action specified: ${finalAction} for subscription ${gatewaySubscriptionId}`);
                 throw new DunningProcessException(`Unknown final dunning action: ${finalAction}`);
             }
         } catch (error) {
             this.logger.error(`Failed to perform final dunning action (${finalAction}) for ${gatewaySubscriptionId}: ${error.message}`, error.stack);
              throw new DunningProcessException(`Failed to perform final dunning action (${finalAction}) for ${gatewaySubscriptionId}`, error);
         }
     }
}