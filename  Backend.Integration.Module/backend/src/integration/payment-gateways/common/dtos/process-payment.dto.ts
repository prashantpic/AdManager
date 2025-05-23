import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Platform-neutral Data Transfer Object for payment processing requests.
 * This DTO defines a common structure for initiating payments across different payment gateways.
 */
export class ProcessPaymentRequestDto {
  /**
   * The amount to be charged, represented in the smallest currency unit (e.g., cents for USD).
   * Example: 1000 for $10.00 USD.
   */
  @IsNumber()
  @IsPositive()
  amount: number;

  /**
   * The ISO 4217 currency code (e.g., "USD", "EUR", "SAR").
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(3)
  currency: string;

  /**
   * A token representing the payment method, obtained from the client-side
   * (e.g., a Stripe token, PayPal payment ID).
   * This field is optional as some payment flows might not use a pre-generated token
   * or might handle payment method details differently.
   */
  @IsString()
  @IsOptional()
  paymentMethodToken?: string;

  /**
   * The platform's internal order identifier associated with this payment.
   * Used for tracking and reconciliation.
   */
  @IsString()
  @IsNotEmpty()
  orderId: string;

  // Additional common fields can be added, such as:
  // customerId?: string;
  // description?: string;
  // metadata?: Record<string, any>;
}