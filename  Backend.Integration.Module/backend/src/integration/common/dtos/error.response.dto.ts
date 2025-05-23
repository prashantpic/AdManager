/**
 * @file error.response.dto.ts
 * @description Standardized Data Transfer Object for representing error responses from external APIs.
 * @namespace AdManager.Platform.Backend.Integration.Common.Dtos
 */

import { IsString, IsNumber, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';

export class ExternalErrorResponseDto {
  /**
   * The name of the external service that produced the error.
   * @requirement REQ-11-005
   */
  @IsString()
  @IsNotEmpty()
  public serviceName: string;

  /**
   * The HTTP status code returned by the external service, or an internal representation.
   * @requirement REQ-11-005
   */
  @IsNumber()
  @IsNotEmpty()
  public statusCode: number;

  /**
   * The error message or array of messages.
   * @requirement REQ-11-005
   */
  @IsNotEmpty()
  public message: string | string[];

  /**
   * An optional error code specific to the external service.
   * @requirement REQ-11-005
   */
  @IsOptional()
  @IsString()
  public errorCode?: string;

  /**
   * Optional additional details or the original error object from the external service.
   * @requirement REQ-11-005
   */
  @IsOptional()
  public details?: any;

  constructor(
    serviceName: string,
    statusCode: number,
    message: string | string[],
    errorCode?: string,
    details?: any,
  ) {
    this.serviceName = serviceName;
    this.statusCode = statusCode;
    this.message = message;
    this.errorCode = errorCode;
    this.details = details;
  }
}