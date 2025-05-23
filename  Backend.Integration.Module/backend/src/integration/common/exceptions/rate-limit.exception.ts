import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for scenarios where rate limits are exceeded on external services.
 * This exception should ideally extend a base IntegrationException.
 */
export class RateLimitExceededException extends HttpException {
  public readonly serviceName: string;
  public readonly retryAfterSeconds?: number;
  public readonly originalError?: any;

  /**
   * Constructor for RateLimitExceededException.
   * @param serviceName - The name of the external service that reported a rate limit.
   * @param message - Optional custom message. Defaults to a standard rate limit message.
   * @param retryAfterSeconds - Optional number of seconds after which a retry might be permissible.
   * @param originalError - Optional original error object caught from the external service or library.
   */
  constructor(
    serviceName: string,
    message?: string,
    retryAfterSeconds?: number,
    originalError?: any,
  ) {
    const defaultMessage = `Rate limit exceeded for external service: ${serviceName}.`;
    super(
      message || defaultMessage,
      HttpStatus.TOO_MANY_REQUESTS, // HTTP 429
    );
    this.serviceName = serviceName;
    this.retryAfterSeconds = retryAfterSeconds;
    this.originalError = originalError;
    this.name = 'RateLimitExceededException';
  }
}