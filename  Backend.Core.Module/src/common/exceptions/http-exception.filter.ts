import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationException } from './validation.exception'; // Assumed to exist
import { BaseException } from './base.exception'; // Assumed to exist
// import { LoggingService } from '../../logging/logging.service'; // Assumed to be injectable via a token or direct class
import { LOGGING_SERVICE } from '../../logging/logging.constants'; // Assuming a token for LoggingService
import { ErrorCodesConstants } from '../constants/error-codes.constants'; // Assumed to exist

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  errorCode?: string;
  details?: any;
}

@Catch()
@Injectable()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LOGGING_SERVICE) private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;
    let errorCode: string | undefined;
    let details: any | undefined;

    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof ValidationException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || 'Input data validation failed';
      errorCode = exceptionResponse.errorCode || ErrorCodesConstants.VALIDATION_ERROR;
      details = exceptionResponse.details || exception.validationErrors;
    } else if (exception instanceof BaseException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = exceptionResponse.message || exception.message;
        errorCode = exceptionResponse.errorCode;
        details = exceptionResponse.details;
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).error; // Default NestJS error field
        // If 'errorCode' is a specific field from our custom HttpExceptions
        if ((exceptionResponse as any).errorCode) {
            errorCode = (exceptionResponse as any).errorCode;
        }
        details = (exceptionResponse as any).details || (exceptionResponse as any).validationErrors;
      } else {
        message = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error. Please try again later.';
      errorCode = 'INTERNAL_SERVER_ERROR';
      // In a production environment, you might not want to expose details of unknown errors
      // For debugging, you might include (exception as Error).message
    }

    const errorLog = {
      timestamp,
      path,
      statusCode,
      message,
      errorCode,
      details,
      exception: exception instanceof Error ? exception.stack : JSON.stringify(exception),
      userId: (request as any).user?.id, // Example: if user context is available on request
      correlationId: request.headers['x-correlation-id'] || request.headers['X-Correlation-ID'],
    };

    this.logger.error(
      `HTTP Exception: ${message}`,
      JSON.stringify(errorLog, null, 2), // Pretty print for readability in logs if they are text-based
      GlobalHttpExceptionFilter.name,
    );
    
    // For structured JSON logging, the logger service itself should handle stringification
    // this.logger.error({ message: `HTTP Exception: ${message}`, ...errorLog }, GlobalHttpExceptionFilter.name);


    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp,
      path,
      message,
    };

    if (errorCode) {
      errorResponse.errorCode = errorCode;
    }
    if (details && Object.keys(details).length > 0) {
      errorResponse.details = details;
    }

    response.status(statusCode).json(errorResponse);
  }
}