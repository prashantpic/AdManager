import { GatewayIdentifier } from '../../../constants/payment.constants';
import { DunningParametersDto } from '../../../dto/dunning-parameters.dto';
import { PaymentTransactionLog } from '../../../persistence/entities/payment-transaction-log.entity';

export interface IDunningStrategy {
  /**
   * Executes the dunning process for a failed recurring payment.
   * This involves determining retry attempts, intervals, and potentially attempting payment.
   * @param gatewaySubscriptionId - The ID of the subscription at the payment gateway.
   * @param gatewayIdentifier - The identifier of the payment gateway.
   * @param dunningParams - Configuration parameters for the dunning process.
   * @param lastPaymentAttempt - The last logged transaction attempt for this subscription.
   * @returns Promise resolving when the dunning attempt is processed (successful retry, scheduled next retry, or final action taken).
   * @throws DunningProcessException if a critical error occurs during the dunning process.
   */
  executeDunning(
    gatewaySubscriptionId: string,
    gatewayIdentifier: GatewayIdentifier,
    dunningParams: DunningParametersDto,
    lastPaymentAttempt: PaymentTransactionLog,
  ): Promise<void>;
}