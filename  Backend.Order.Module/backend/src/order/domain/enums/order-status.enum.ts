/**
 * Enumeration of possible order statuses.
 * Standardizes order status values used throughout the Order domain.
 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  AWAITING_SHIPMENT = 'AWAITING_SHIPMENT',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED', // Order fulfilled and no further action needed
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED', // Payment failure, fraud, etc.
}