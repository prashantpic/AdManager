```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Opossum from 'opossum';

// Placeholder for IntegrationModuleConfig - should be in common/config/integration.config.ts
export interface IntegrationModuleConfig {
  circuitBreakerFailureThreshold: number; // e.g., 0.5 (50%)
  circuitBreakerOpenStateTimeoutMs: number; // e.g., 30000 (30 seconds)
  // Could add more opossum options like rollingCountTimeout, rollingCountBuckets, etc.
}

// Placeholder for ExternalServiceUnavailableException
export class ExternalServiceUnavailableException extends HttpException {
  constructor(serviceName: string, message?: string, originalError?: any) {
    super(
      message || `External service ${serviceName} is unavailable due to open circuit.`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.name = 'ExternalServiceUnavailableException';
  }
}

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CircuitBreakerInterceptor.name);
  private readonly breakers = new Map<string, Opossum>();
  private readonly failureThreshold: number;
  private readonly openStateTimeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.failureThreshold = this.configService.get<number>(
      'integration.circuitBreakerFailureThreshold',
      0.5,
    );
    this.openStateTimeoutMs = this.configService.get<number>(
      'integration.circuitBreakerOpenStateTimeoutMs',
      30000,
    );
  }

  private getBreaker(serviceName: string): Opossum {
    if (!this.breakers.has(serviceName)) {
      const options: Opossum.Options = {
        timeout: false, // We rely on HTTP client's timeout
        errorThresholdPercentage: this.failureThreshold * 100,
        resetTimeout: this.openStateTimeoutMs,
        name: serviceName,
      };
      const breaker = new Opossum(async (obs: Observable<any>) => obs.toPromise(), options); // Opossum expects a promise-returning function

      breaker.on('open', () => this.logger.warn(`Circuit open for ${serviceName}`));
      breaker.on('halfOpen', () => this.logger.warn(`Circuit half-open for ${serviceName}`));
      breaker.on('close', () => this.logger.log(`Circuit closed for ${serviceName}`));
      breaker.on('failure', (error, executionTime) => this.logger.warn(`Circuit failure for ${serviceName} in ${executionTime}ms`, error.message));
      // Opossum's fallback is not used here as we throw an exception.
      
      this.breakers.set(serviceName, breaker);
    }
    return this.breakers.get(serviceName)!;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Determine serviceName, e.g., from request metadata or controller/method name
    // For simplicity, let's assume serviceName can be derived from context or a custom decorator
    // This part needs a robust way to identify the target external service for the circuit breaker.
    // For now, let's use a generic key or derive from class/handler name.
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const serviceKey = `${className}.${methodName}`; // This might be too granular, consider a coarser key.

    const breaker = this.getBreaker(serviceKey); // Or a more specific serviceName if available

    return from(breaker.fire(next.handle())).pipe(
        catchError(err => {
            if (err.code === 'EOPENBREAKER') { // Opossum specific error code when circuit is open
                this.logger.error(`Circuit breaker is open for ${serviceKey}. Call rejected.`, err.message);
                return throwError(() => new ExternalServiceUnavailableException(serviceKey, `Circuit breaker is open for ${serviceKey}. Call rejected.`, err));
            }
             // Propagate other errors, including those from the actual external call if the circuit was closed/half-open
            return throwError(() => err);
        })
    );
  }
}
```