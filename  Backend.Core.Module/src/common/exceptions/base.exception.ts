import { HttpException, HttpStatus } from '@nestjs/common';
import { CommonErrorCodes } from '../constants/error-codes.constants';

/**
 * @file Base class for custom application exceptions.
 * @namespace AdManager.Platform.Backend.Core.Common.Exceptions
 */

export class BaseException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string | Record<string, any>,
    status: HttpStatus,
    errorCode: string = CommonErrorCodes.INTERNAL_SERVER_ERROR,
    details?: any,
  ) {
    super(message, status);
    this.errorCode = errorCode;
    this.details = details;
  }
}