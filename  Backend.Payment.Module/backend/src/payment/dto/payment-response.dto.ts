import { PaymentStatus } from '../constants/payment.constants';

export class PaymentResponseDto {
  transactionId: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  message?: string;
  // Non-sensitive raw response details from gateway.
  gatewayResponse?: Record<string, any>;
}