import { IsInt, IsNumber, Min } from 'class-validator';

/**
 * Defines the structure for module-level configuration for the IntegrationModule.
 * These values are typically loaded via CoreModule's ConfigService from environment variables
 * or a central configuration store like AWS Parameter Store.
 */
export class IntegrationModuleConfig {
  /**
   * Default number of retry attempts for failed external API calls.
   */
  @IsInt()
  @Min(0)
  defaultRetryAttempts: number;

  /**
   * Default initial delay in milliseconds before the first retry attempt.
   * Subsequent retries might use exponential backoff.
   */
  @IsInt()
  @Min(0)
  defaultRetryInitialDelayMs: number;

  /**
   * Default timeout in milliseconds for external API requests.
   */
  @IsInt()
  @Min(100) // Minimum 100ms timeout
  defaultTimeoutMs: number;

  /**
   * The failure rate threshold (e.g., 0.5 for 50%) over a time window
   * that, when exceeded, will open the circuit breaker.
   */
  @IsNumber()
  @Min(0.01) // Must be greater than 0
  circuitBreakerFailureThreshold: number;

  /**
   * The time in milliseconds the circuit breaker will stay in the 'open' state
   * before transitioning to 'half-open' to allow a test request.
   */
  @IsInt()
  @Min(1000) // Minimum 1 second
  circuitBreakerOpenStateTimeoutMs: number;
}