import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for cases where an external service is unavailable or fails persistently.
 * This exception should ideally extend a base IntegrationException.
 */
export class ExternalServiceUnavailableException extends HttpException {
  public readonly serviceName: string;
  public readonly originalError?: any;

  /**
   * Constructor for ExternalServiceUnavailableException.
   * @param serviceName - The name of the external service that is unavailable.
   * @param message - Optional custom message. Defaults to a standard service unavailable message.
   * @param originalError - Optional original error object caught, e.g., network error or 5xx response.
   */
  constructor(serviceName: string, message?: string, originalError?: any) {
    const defaultMessage = `External service ${serviceName} is currently unavailable or experiencing issues.`;
    super(
      message || defaultMessage,
      HttpStatus.SERVICE_UNAVAILABLE, // HTTP 503 or related
    );
    this.serviceName = serviceName;
    this.originalError = originalError;
    this.name = 'ExternalServiceUnavailableException';
  }
}