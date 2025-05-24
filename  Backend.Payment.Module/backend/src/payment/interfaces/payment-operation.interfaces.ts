import { GatewayIdentifier, PaymentStatus } from '../constants/payment.constants';
import { DunningParametersDto } from '../dto/dunning-parameters.dto';

// Contains miscellaneous interfaces related to payment operations.

/**
 * Represents a detailed log entry for a payment or refund transaction attempt.
 */
export interface TransactionDetails {
  id: string;
  gateway: GatewayIdentifier;
  gatewayTransactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  // e.g., 'sale', 'refund', 'subscription_payment'
  type: string;
  createdAt: Date;
  updatedAt: Date;
  merchantId: string;
  orderId?: string;
  gatewaySubscriptionId?: string;
  errorMessage?: string;
  gatewayResponse?: any; // Non-sensitive details
}

/**
 * Configuration options for recurring billing processes.
 */
export interface RecurringBillingOptions {
  dunningParameters: DunningParametersDto;
  // Add other recurring billing options here if needed (e.g., trial period, setup fee handling)
}