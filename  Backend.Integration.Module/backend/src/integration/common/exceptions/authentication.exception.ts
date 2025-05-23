import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for authentication failures encountered while communicating with external services.
 * This exception should ideally extend a base IntegrationException.
 */
export class ExternalServiceAuthenticationException extends HttpException {
  public readonly serviceName: string;
  public readonly originalError?: any;

  /**
   * Constructor for ExternalServiceAuthenticationException.
   * @param serviceName - The name of the external service where authentication failed.
   * @param message - Optional custom message. Defaults to a standard authentication failure message.
   * @param originalError - Optional original error object caught from the external service or library.
   */
  constructor(serviceName: string, message?: string, originalError?: any) {
    const defaultMessage = `Authentication failed with external service: ${serviceName}.`;
    super(
      message || defaultMessage,
      HttpStatus.UNAUTHORIZED, // Typically 401 or 403
    );
    this.serviceName = serviceName;
    this.originalError = originalError;
    this.name = 'ExternalServiceAuthenticationException';
  }
}