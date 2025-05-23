/**
 * @file Defines constants related to logging.
 */

export const LoggingConstants = {
  /**
   * Default context name for logs if no specific context is provided.
   */
  DEFAULT_LOG_CONTEXT: 'Application',

  /**
   * HTTP Header key for correlation ID.
   * This should align with how correlation IDs are propagated (e.g., by API Gateway, TracingInterceptor).
   */
  CORRELATION_ID_HEADER: 'x-correlation-id',

  /**
   * HTTP Header key for request ID, often used interchangeably with correlation ID.
   */
  REQUEST_ID_HEADER: 'x-request-id', // Common alternative
};