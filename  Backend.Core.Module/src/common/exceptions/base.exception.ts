import { HttpException, HttpStatus } from '@nestjs/common';
import { CommonErrorCodes } from '../constants/error-codes.constants';

/**
 * @interface BaseExceptionArgs
 * @description Arguments for constructing a BaseException.
 */
export interface BaseExceptionArgs {
  message: string;
  status: HttpStatus;
  errorCode?: CommonErrorCodes | string;
  details?: any;
  cause?: Error;
}

/**
 * @class BaseException
 * @description Base class for custom application exceptions.
 * Extends NestJS HttpException to ensure proper HTTP response handling.
 */
export class BaseException extends HttpException {
  public readonly errorCode: CommonErrorCodes | string;
  public readonly details?: any;

  constructor(args: BaseExceptionArgs) {
    super(
      HttpException.createBody(
        args.message,
        args.errorCode || CommonErrorCodes.INTERNAL_SERVER_ERROR,
        args.status,
      ),
      args.status,
      { cause: args.cause },
    );
    this.errorCode = args.errorCode || CommonErrorCodes.INTERNAL_SERVER_ERROR;
    this.details = args.details;
  }
}