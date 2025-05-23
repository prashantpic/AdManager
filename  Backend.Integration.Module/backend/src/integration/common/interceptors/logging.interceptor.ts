```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpRequest } from '@nestjs/common/interfaces';

// Helper to mask sensitive data - very basic, extend as needed
function maskSensitiveData(data: any, fieldsToMask: string[] = ['authorization', 'apiKey', 'clientSecret', 'token', 'password']): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, fieldsToMask));
  }

  const maskedObject = { ...data };
  for (const key in maskedObject) {
    if (fieldsToMask.includes(key.toLowerCase())) {
      maskedObject[key] = '***MASKED***';
    } else if (typeof maskedObject[key] === 'object') {
      maskedObject[key] = maskSensitiveData(maskedObject[key], fieldsToMask);
    }
  }
  return maskedObject;
}


@Injectable()
export class ExternalCallLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ExternalCallLogging'); // Context specific logger

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<HttpRequest>(); // This context is for inbound HTTP calls to NestJS.
                                                                  // For outbound HTTP logging (e.g. from HttpClientService),
                                                                  // this interceptor would typically be applied to the HttpService instance
                                                                  // or methods of HttpClientService itself.

    // If this interceptor is used on NestJS controllers/services that make external calls:
    const { method, originalUrl, body, headers } = request || {};
    const logContext = `${context.getClass().name}.${context.getHandler().name}`;

    this.logger.log(
      `[${logContext}] External Call Triggered - Method: ${method}, URL: ${originalUrl}`,
      // `Request Body: ${JSON.stringify(maskSensitiveData(body))}`, // Log request body if relevant to external call context
      // `Request Headers: ${JSON.stringify(maskSensitiveData(headers))}`,
    );

    return next.handle().pipe(
      tap((responseBody) => {
        const responseLog = {
          // responseBody: maskSensitiveData(responseBody), // If response from external service is directly returned
          durationMs: Date.now() - now,
        };
        this.logger.log(
          `[${logContext}] External Call Succeeded - Duration: ${responseLog.durationMs}ms`,
          // `Response: ${JSON.stringify(responseLog.responseBody)}`,
        );
      }),
      catchError((error) => {
        this.logger.error(
          `[${logContext}] External Call Failed - Duration: ${Date.now() - now}ms`,
          `Error: ${error.message}, Status: ${error.status}`,
          error.stack,
          // `Details: ${JSON.stringify(maskSensitiveData(error.response?.data || error.response))}`
        );
        throw error;
      }),
    );
  }
}
// Note: For logging actual outbound HTTP requests made by HttpService (Axios),
// it's common to configure Axios interceptors directly on the HttpService instance
// or use a dedicated NestJS interceptor applied to the HttpModule or HttpClientService.
// The above implementation is a generic NestJS interceptor suitable for logging around
// a method that *makes* an external call.
```