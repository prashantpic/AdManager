export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum GatewayIdentifier {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MADA = 'MADA',
  STCPAY = 'STCPAY',
}

export enum RecurringPaymentEvent {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  CANCELED = 'CANCELED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
}

export enum DunningStatus {
  ACTIVE = 'ACTIVE',
  RETRIED = 'RETRIED',
  EXHAUSTED = 'EXHAUSTED',
  RESOLVED = 'RESOLVED',
}

export enum TransactionType {
    SALE = 'SALE',
    REFUND = 'REFUND',
    RECURRING_INITIAL = 'RECURRING_INITIAL',
    RECURRING_RENEWAL = 'RECURRING_RENEWAL',
    RECURRING_RETRY = 'RECURRING_RETRY',
    CHARGE = 'CHARGE', // Used by webhooks for completed charges
}