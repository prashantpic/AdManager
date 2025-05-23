/**
 * @description Defines constants related to logging.
 */
export const LoggingConstants = {
  /**
   * Default header key for correlation ID.
   * This ID helps trace a request across multiple services or components.
   */
  CORRELATION_ID_HEADER: 'x-correlation-id',

  /**
   * Default header key for request ID.
   * Often used as a unique identifier for a single HTTP request.
   */
  REQUEST_ID_HEADER: 'x-request-id',

  /**
   * Default logging context name if none is provided.
   */
  DEFAULT_CONTEXT: 'Application',

  /**
   * Key used in log messages to store the correlation ID.
   */
  CORRELATION_ID_LOG_KEY: 'correlationId',

   /**
   * Key used in log messages to store the request ID.
   */
  REQUEST_ID_LOG_KEY: 'requestId',

  /**
   * Key used for context in structured logs.
   */
  CONTEXT_LOG_KEY: 'context',
};