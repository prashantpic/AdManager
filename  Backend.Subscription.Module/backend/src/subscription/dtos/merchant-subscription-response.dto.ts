import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { SubscriptionPlanResponseDto } from './subscription-plan-response.dto';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

// Structure for billing information in response
export class BillingInfoResponseDto {
  paymentMethodTokenSnippet: string; // e.g., last 4 digits, type
  address?: string;
  contactEmail?: string;
}

// Structure for payment history item in response
export class PaymentHistoryItemResponseDto {
  amount: number;
  currency: string;
  date: Date;
  type: 'charge' | 'refund';
  status: 'success' | 'failed';
  gatewayTransactionId?: string;
  reason?: string;
}

export class MerchantSubscriptionResponseDto {
  id: string;
  merchantId: string;
  plan: SubscriptionPlanResponseDto;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingInfo: BillingInfoResponseDto | null;
  paymentHistory: PaymentHistoryItemResponseDto[];
}