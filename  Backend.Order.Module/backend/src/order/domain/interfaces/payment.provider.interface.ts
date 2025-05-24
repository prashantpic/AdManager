import { CustomerDetailsDto } from "../../../application/dtos/create-order.dto";

// Data sent to the payment provider for processing a payment
export interface PaymentRequestData {
  orderId: string; // Unique ID for the order being paid
  amount: number; // The final amount to be charged, after all discounts and including shipping/taxes
  currency: string; // ISO currency code (e.g., "USD", "SAR")
  customerDetails: CustomerDetailsDto; // Billing details for the customer
  paymentMethodId?: string; // For using a saved payment method
  paymentToken?: string; // For a one-time payment method (e.g., Stripe token, PayPal nonce)
  merchantId: string; // Identifier for the merchant account processing the payment
  description?: string; // Optional description for the payment statement
  idempotencyKey?: string; // To prevent duplicate processing
  // Any other gateway-specific or required fields
}

// Response from the payment provider after a payment attempt
export interface PaymentResponseData {
  transactionId: string; // Unique ID from the payment gateway for this transaction
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REQUIRES_ACTION'; // Status of the payment
  gatewayResponseCode?: string; // Code from the gateway
  errorMessage?: string; // Message if the payment failed or requires action
  // For SCA (Strong Customer Authentication) or 3D Secure:
  nextAction?: {
    type: 'redirect_to_url' | 'use_stripe_sdk' | string; // Type of action required
    redirectToUrl?: string; // URL for redirection if needed
    // Other fields for specific actions
  };
  // Other relevant details like auth code, payment method details used, etc.
}

export const IPaymentProvider = Symbol('IPaymentProvider');

export interface IPaymentProvider {
  /**
   * Initiates payment processing for an order.
   * @param paymentDetails The data required by the payment gateway.
   * @returns A Promise resolving to PaymentResponseData, indicating the outcome of the payment attempt.
   * @throws PaymentProcessingException or more specific exceptions on failure.
   */
  processPayment(paymentDetails: PaymentRequestData): Promise<PaymentResponseData>;

  // Other potential methods:
  // refundPayment(transactionId: string, amountToRefund: number, reason?: string): Promise<RefundResponseData>;
  // capturePreAuthorizedPayment(transactionId: string, amountToCapture?: number): Promise<CaptureResponseData>;
  // voidPayment(transactionId: string): Promise<VoidResponseData>;
}