/**
 * Shared constants for the Order module.
 * Centralizes module-specific constant values for better maintainability and consistency.
 */
export const OrderConstants = {
  /**
   * Default currency for orders if not specified by merchant or context.
   */
  DEFAULT_CURRENCY: 'USD',

  /**
   * SQS Queue URL for publishing order-related domain events.
   * This should be configured via environment variables.
   */
  ORDER_EVENT_SQS_QUEUE_URL: process.env.ORDER_EVENT_SQS_QUEUE_URL || 'http://localhost:4566/000000000000/admanager-order-events', // Default for local development with LocalStack

  /**
   * Prefix for order IDs, if any specific format is required (e.g., "ORD-").
   * For UUIDs, this is usually not needed.
   */
  // ORDER_ID_PREFIX: 'ORD-',
};