/**
 * @file integration.exception.ts
 * @description Base custom exception for general integration failures with external services.
 * @namespace AdManager.Platform.Backend.Integration.Common.Exceptions
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base custom exception for general integration failures.
 * This class serves as a base for more specific integration-related exceptions,
 * allowing for consistent error handling across the integration module.
 * @requirement REQ-11-005
 */
export class IntegrationException extends HttpException {
  public readonly serviceName?: string;
  public readonly originalError?: any;
  public readonly errorCode?: string;

  /**
   * Creates an instance of IntegrationException.
   * @param {string} message The error message.
   * @param {string} [serviceName] The name of the external service involved.
   * @param {number} [httpStatus=HttpStatus.INTERNAL_SERVER_ERROR] The HTTP status code for this exception.
   * @param {any} [originalError] The original error object caught.
   * @param {string} [errorCode] A specific error code from the external service or internal system.
   */
  constructor(
    message: string,
    serviceName?: string,
    httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR,
    originalError?: any,
    errorCode?: string,
  ) {
    super(
      HttpException.createBody(
        message,
        `Integration Error${serviceName ? ` with ${serviceName}` : ''}`,
        httpStatus,
      ),
      httpStatus,
    );
    this.serviceName = serviceName;
    this.originalError = originalError;
    this.errorCode = errorCode;
    this.name = 'IntegrationException';
  }
}