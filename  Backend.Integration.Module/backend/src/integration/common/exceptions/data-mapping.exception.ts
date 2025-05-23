import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for errors occurring during data mapping to or from external service formats.
 * This exception should ideally extend a base IntegrationException.
 */
export class DataMappingException extends HttpException {
  public readonly serviceName: string;
  public readonly originalData?: any;
  public readonly mappedData?: any;

  /**
   * Constructor for DataMappingException.
   * @param serviceName - The name of the service for which data mapping failed.
   * @param message - A descriptive message of the mapping error.
   * @param originalData - Optional original data that was being transformed.
   * @param mappedData - Optional partially mapped data, if available, for debugging.
   */
  constructor(
    serviceName: string,
    message: string,
    originalData?: any,
    mappedData?: any,
  ) {
    super(
      `Data mapping error for service ${serviceName}: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.serviceName = serviceName;
    this.originalData = originalData;
    this.mappedData = mappedData;
    this.name = 'DataMappingException';
  }
}