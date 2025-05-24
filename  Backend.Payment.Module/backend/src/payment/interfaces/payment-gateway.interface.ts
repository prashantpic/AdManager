import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { CreateRecurringPaymentDto } from '../dto/create-recurring-payment.dto';
import { RecurringPaymentDetailsDto } from '../dto/recurring-payment-details.dto';
import { CancelRecurringPaymentDto } from '../dto/cancel-recurring-payment.dto';
import { WebhookEventDto } from '../dto/webhook-event.dto';

export interface IPaymentGateway {
  /**
   * Processes a one-time merchant sale payment.
   * @param paymentDetails - Details required to process the payment, including tokenized payment method.
   * @returns Promise resolving to the payment transaction response.
   */
  processPayment(paymentDetails: ProcessPaymentDto): Promise<PaymentResponseDto>;

  /**
   * Initiates a refund for a previously processed payment.
   * @param refundDetails - Details required to initiate the refund.
   * @returns Promise resolving to the refund transaction response.
   */
  refundPayment(refundDetails: RefundPaymentDto): Promise<PaymentResponseDto>;

  /**
   * Sets up a new recurring payment plan for a customer's subscription.
   * @param subscriptionDetails - Details required to create the subscription plan at the gateway.
   * @returns Promise resolving to the details of the created recurring payment plan.
   */
  createRecurringPayment(subscriptionDetails: CreateRecurringPaymentDto): Promise<RecurringPaymentDetailsDto>;

  /**
   * Retrieves the current details of an existing recurring payment plan from the gateway.
   * @param gatewaySubscriptionId - The ID of the subscription plan at the payment gateway.
   * @returns Promise resolving to the recurring payment plan details.
   */
  getRecurringPaymentDetails(gatewaySubscriptionId: string): Promise<RecurringPaymentDetailsDto>;

  /**
   * Cancels an existing recurring payment plan at the gateway.
   * @param cancelDetails - Details required to cancel the subscription.
   * @returns Promise resolving when the cancellation request is successfully sent.
   */
  cancelRecurringPayment(cancelDetails: CancelRecurringPaymentDto): Promise<void>;

  /**
   * Verifies the signature of an incoming webhook payload to ensure authenticity.
   * @param payload - The raw webhook payload (string or buffer).
   * @param signature - The signature provided in the webhook request headers.
   * @param secret - The webhook signing secret configured for this gateway.
   * @returns True if the signature is valid, false otherwise.
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean;

  /**
   * Parses the raw webhook payload into a standardized WebhookEventDto.
   * @param rawPayload - The raw payload received from the gateway.
   * @returns A standardized DTO representing the webhook event.
   */
  parseWebhookEvent(rawPayload: any): WebhookEventDto;
}