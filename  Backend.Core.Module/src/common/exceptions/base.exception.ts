import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constants';

/**
 * @description Base class for custom application exceptions.
 */
export class BaseException extends HttpException {
  public readonly errorCode: ErrorCodes | string;
  public readonly details?: any;

  constructor(
    message: string | Record<string, any>,
    status: HttpStatus,
    errorCode: ErrorCodes | string = ErrorCodes.UNKNOWN_ERROR,
    details?: any,
  ) {
    super(message, status);
    this.errorCode = errorCode;
    this.details = details;
  }
}