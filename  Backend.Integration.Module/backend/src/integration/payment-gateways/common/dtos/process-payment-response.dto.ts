/**
 * Platform-neutral Data Transfer Object for payment processing responses.
 * This DTO defines a common structure for representing the outcome of a payment attempt
 * across different payment gateways.
 */
export class ProcessPaymentResponseDto {
  /**
   * The unique transaction identifier assigned by the payment gateway or the platform.
   */
  transactionId: string;

  /**
   * The status of the payment (e.g., "succeeded", "pending", "failed", "requires_action").
   * The specific status values may vary slightly by gateway but should be normalized.
   */
  status: string;

  /**
   * The raw response object received from the payment gateway.
   * This can be useful for debugging or accessing gateway-specific information.
   * It's optional as it might not always be needed or available.
   */
  gatewayResponse?: any;

  // Additional common fields can be added, such as:
  // message?: string; // A user-friendly message about the payment status
  // errorCode?: string; // A normalized error code if the payment failed
  // requiresActionDetails?: any; // Details if further customer action is needed (e.g., 3D Secure)
}