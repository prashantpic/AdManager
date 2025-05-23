import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger, // Using NestJS Logger as a fallback if LoggingService is not yet available/injected
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationException } from './validation.exception';
import { BaseException } from './base.exception';
// Assuming LoggingService will be in this path, adjust if different
// import { LoggingService } from '../../logging/logging.service';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  errorCode?: string;
  details?: any;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  // constructor(private readonly loggingService: LoggingService) {}
  // Using NestJS Logger for now if LoggingService DI is complex at this stage of generation
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;
    let errorCode: string | undefined;
    let details: any | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as any).message || exception.message;
        errorCode = (errorResponse as any).errorCode; // For BaseException
        details = (errorResponse as any).details || (errorResponse as any).errors; // For ValidationException or custom details
      } else {
        message = exception.message;
      }

      if (exception instanceof ValidationException) {
        errorCode = exception.errorCode || 'VALIDATION_ERROR';
        details = exception.getResponse()['errors'] || exception.getResponse()['details'] || exception.getValidationErrors();
      } else if (exception instanceof BaseException) {
        errorCode = exception.errorCode;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      // this.loggingService.error(exception.message, exception.stack, `${request.method} ${request.url}`);
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      // this.loggingService.error('Unexpected error', undefined, `${request.method} ${request.url}`, exception);
      this.logger.error(
        'Unexpected error',
        undefined,
        `${request.method} ${request.url}`,
      );
    }
    
    // Ensure statusCode is set
    if (!statusCode) {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }


    // Log detailed error for HttpExceptions as well
    if (exception instanceof HttpException) {
        // this.loggingService.error(
        //   `HTTP Exception: ${message}`,
        //   exception.stack,
        //   `${request.method} ${request.url} - Status: ${statusCode}`,
        //   details || exception.getResponse(),
        // );
         this.logger.error(
           `HTTP Exception: ${message} - Path: ${request.url} - Method: ${request.method}`,
           exception.stack,
           `${GlobalHttpExceptionFilter.name} - Status: ${statusCode}`,
         );
    }


    const errorResponseBody: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    if (errorCode) {
      errorResponseBody.errorCode = errorCode;
    }
    if (details) {
      errorResponseBody.details = details;
    }

    response.status(statusCode).json(errorResponseBody);
  }
}