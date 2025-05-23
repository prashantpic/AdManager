import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // Using NestJS Logger as a fallback if LoggingService is not yet available
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

// Placeholder: Actual LoggingService will be injected once available.
// import { LoggingService } from '../../logging/logging.service';
import { ValidationException } from './validation.exception';
import { BaseException } from './base.exception';
// Placeholder: Actual ErrorCodesConstants will be used once available.
// import { ErrorCodesConstants } from '../constants/error-codes.constants';

interface IErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | object;
  errorCode?: string;
  details?: any;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  // Using NestJS Logger temporarily. Replace with LoggingService when available.
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);
  // constructor(private readonly loggingService: LoggingService, private readonly httpAdapterHost: HttpAdapterHost) {}
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {} // Remove LoggingService if not using it directly here

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let statusCode: number;
    let message: string | object;
    let errorCode: string | undefined;
    let details: any | undefined;

    const path = httpAdapter.getRequestUrl(request);
    const timestamp = new Date().toISOString();

    if (exception instanceof ValidationException) {
      statusCode = exception.getStatus();
      message = exception.getResponse()['message'] || 'Validation failed';
      errorCode = exception.getErrorCode() || 'VALIDATION_ERROR'; // Use actual constant
      details = exception.getResponse()['errors'] || exception.getValidationErrors();
      this.logger.warn(
        `ValidationException: ${message} - Path: ${path} - Details: ${JSON.stringify(details)}`,
        exception.stack,
        GlobalHttpExceptionFilter.name,
      );
    } else if (exception instanceof BaseException) {
      statusCode = exception.getStatus();
      message = exception.getResponse()['message'] || exception.message;
      errorCode = exception.getErrorCode();
      details = exception.getResponse()['details'];
      this.logger.error(
        `BaseException: ${message} - Code: ${errorCode} - Path: ${path}`,
        exception.stack,
        GlobalHttpExceptionFilter.name,
      );
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || 'An HTTP error occurred';
        errorCode = (exceptionResponse as any).error; // Or a more specific property
        details = (exceptionResponse as any).details || (exceptionResponse as any).errors;
      } else {
        message = 'An unexpected HTTP error occurred';
      }
      this.logger.error(
        `HttpException: ${message} - Status: ${statusCode} - Path: ${path}`,
        exception.stack,
        GlobalHttpExceptionFilter.name,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_SERVER_ERROR'; // Use actual constant
      this.logger.error(
        `UnhandledException: ${(exception as Error).message || 'Unknown error'} - Path: ${path}`,
        (exception as Error).stack,
        GlobalHttpExceptionFilter.name,
      );
      if (process.env.NODE_ENV !== 'production') {
        details = {
          name: (exception as Error).name,
          message: (exception as Error).message,
          stack: (exception as Error).stack,
        };
      }
    }

    const responseBody: IErrorResponse = {
      statusCode,
      timestamp,
      path,
      message,
    };

    if (errorCode) {
      responseBody.errorCode = errorCode;
    }
    if (details) {
      responseBody.details = details;
    }

    // TODO: Integrate with actual LoggingService (REQ-16-025, REQ-16-026)
    // this.loggingService.error(message, exception.stack, GlobalHttpExceptionFilter.name, {
    //     path,
    //     method: request.method,
    //     statusCode,
    //     ...(errorCode && { errorCode }),
    //     ...(details && { details }),
    // });

    httpAdapter.reply(response, responseBody, statusCode);
  }
}