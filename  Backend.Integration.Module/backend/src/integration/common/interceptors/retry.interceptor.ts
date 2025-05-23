```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, delayWhen, take, catchError, tap } from 'rxjs/operators';

// Placeholder for IntegrationModuleConfig - should be in common/config/integration.config.ts
export interface IntegrationModuleConfig {
  defaultRetryAttempts: number;
  defaultRetryInitialDelayMs: number;
  // Potentially service-specific retry configs could be added here
}

// Placeholder for RateLimitExceededException
export class RateLimitExceededException extends Error {
  constructor(
    public serviceName: string,
    message?: string,
    public readonly retryAfterSeconds?: number,
    public originalError?: any,
  ) {
    super(message || 'Rate limit exceeded');
    this.name = 'RateLimitExceededException';
  }
}


@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);
  private readonly defaultRetryAttempts: number;
  private readonly defaultRetryInitialDelayMs: number;

  constructor(private readonly configService: ConfigService) {
    // Assuming config is loaded under 'integration' key
    this.defaultRetryAttempts = this.configService.get<number>(
      'integration.defaultRetryAttempts',
      3,
    );
    this.defaultRetryInitialDelayMs = this.configService.get<number>(
      'integration.defaultRetryInitialDelayMs',
      1000,
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            const maxAttempts = this.defaultRetryAttempts; // Could be customized based on context/error
            const initialDelay = this.defaultRetryInitialDelayMs; // Could be customized

            // Check for RateLimitExceededException specifically to use retryAfterSeconds
            if (error instanceof RateLimitExceededException && error.retryAfterSeconds) {
              if (attempt < maxAttempts) {
                const delayTime = error.retryAfterSeconds * 1000;
                this.logger.warn(
                  `Rate limit hit for ${error.serviceName}. Retrying attempt ${attempt + 1}/${maxAttempts} after ${delayTime / 1000}s...`,
                );
                return timer(delayTime);
              }
            }
            
            // General retryable errors (e.g., 5xx, network issues)
            // This needs more sophisticated error checking based on actual error structure from HttpClientService
            const isRetryable =
              (error.status && error.status >= 500 && error.status < 600) || // Server errors
              error.name === 'ExternalServiceUnavailableException' || // Custom unavailable exception
              (error.isAxiosError && !error.response); // Network errors (request made but no response)

            if (isRetryable && attempt < maxAttempts) {
              const delayTime = initialDelay * Math.pow(2, attempt); // Exponential backoff
              this.logger.warn(
                `Retryable error encountered. Retrying attempt ${attempt + 1}/${maxAttempts} after ${delayTime / 1000}s... (Error: ${error.message})`,
              );
              return timer(delayTime);
            }
            
            // If not retryable or max attempts reached, re-throw
            return throwError(() => error);
          }),
        ),
      ),
    );
  }
}
```