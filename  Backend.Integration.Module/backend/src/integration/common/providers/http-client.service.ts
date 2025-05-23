```typescript
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ExternalTokenService } from '../../auth/token.service';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';

// Placeholder for ExternalServiceId enum - should be in common/enums/external-service.enum.ts
export enum ExternalServiceId {
  GOOGLE_ADS = 'GOOGLE_ADS',
  FACEBOOK_ADS = 'FACEBOOK_ADS',
  TIKTOK_ADS = 'TIKTOK_ADS',
  SNAPCHAT_ADS = 'SNAPCHAT_ADS',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MADA = 'MADA',
  STC_PAY = 'STC_PAY',
  SHIPPO = 'SHIPPO',
  ZAPIER = 'ZAPIER',
  PAYPAL_PAYOUTS = 'PAYPAL_PAYOUTS',
  WISE_PAYOUTS = 'WISE_PAYOUTS',
  // Add other services as needed
}

// Placeholder for custom exceptions - should be in common/exceptions/
export class IntegrationException extends HttpException {
  constructor(
    message: string,
    public readonly serviceName?: string,
    httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly originalError?: any,
    public readonly errorCode?: string,
  ) {
    super(
      {
        message,
        serviceName,
        errorCode,
        details: originalError?.message || originalError,
      },
      httpStatus,
    );
  }
}

export class ExternalServiceAuthenticationException extends IntegrationException {
  constructor(serviceName: string, message?: string, originalError?: any) {
    super(
      message || 'Authentication failed with external service.',
      serviceName,
      HttpStatus.UNAUTHORIZED,
      originalError,
      'AUTH_FAILURE',
    );
  }
}

export class RateLimitExceededException extends IntegrationException {
  constructor(
    serviceName: string,
    message?: string,
    public readonly retryAfterSeconds?: number,
    originalError?: any,
  ) {
    super(
      message || 'Rate limit exceeded for external service.',
      serviceName,
      HttpStatus.TOO_MANY_REQUESTS,
      originalError,
      'RATE_LIMIT_EXCEEDED',
    );
  }
}

export class ExternalServiceUnavailableException extends IntegrationException {
  constructor(serviceName: string, message?: string, originalError?: any) {
    super(
      message || 'External service is unavailable.',
      serviceName,
      HttpStatus.SERVICE_UNAVAILABLE,
      originalError,
      'SERVICE_UNAVAILABLE',
    );
  }
}

export interface AxiosRequestConfigExt extends AxiosRequestConfig {
  serviceId?: ExternalServiceId;
  merchantId?: string;
  // May include service-specific metadata for interceptors or auth
}

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly externalTokenService: ExternalTokenService,
    private readonly configService: ConfigService, // For potential global timeout configs
  ) {}

  public async request<T>(
    config: AxiosRequestConfigExt,
    serviceId: ExternalServiceId, // serviceId passed explicitly for clarity and auth
  ): Promise<AxiosResponse<T>> {
    const { merchantId, ...axiosConfig } = config;
    
    let authHeaders: Record<string, string> = {};
    if (serviceId && merchantId) { // merchantId might be optional for some services/tokens
      try {
        authHeaders = await this.externalTokenService.getAuthHeaders(serviceId, merchantId);
      } catch (error) {
        this.logger.error(`Failed to get auth headers for ${serviceId} and merchant ${merchantId}`, error.stack);
        throw new ExternalServiceAuthenticationException(serviceId, 'Failed to retrieve authentication credentials.', error);
      }
    } else if (serviceId) { // For services not requiring merchantId (e.g. platform-wide API key)
        try {
            authHeaders = await this.externalTokenService.getAuthHeaders(serviceId);
        } catch (error) {
            this.logger.error(`Failed to get auth headers for ${serviceId}`, error.stack);
            throw new ExternalServiceAuthenticationException(serviceId, 'Failed to retrieve authentication credentials.', error);
        }
    }


    const finalConfig: AxiosRequestConfig = {
      ...axiosConfig,
      headers: {
        ...axiosConfig.headers,
        ...authHeaders,
      },
      // Example: Get default timeout from config
      // timeout: this.configService.get<number>('integration.defaultTimeoutMs', 5000),
    };

    this.logger.debug(`External API Request: ${finalConfig.method?.toUpperCase()} ${finalConfig.url}`);

    return firstValueFrom(
      this.httpService.request<T>(finalConfig).pipe(
        map((response) => {
          this.logger.debug(`External API Response: ${response.status} ${finalConfig.url}`);
          return response;
        }),
        catchError((error: AxiosError) => {
          this.logger.error(
            `External API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${
              error.response?.status
            } - Message: ${error.message}`,
            error.stack,
          );
          throw this.normalizeError(error, serviceId);
        }),
      ),
    );
  }

  public async get<T>(
    url: string,
    config?: AxiosRequestConfigExt,
    serviceId?: ExternalServiceId, // Allow serviceId to be optional if already in config
  ): Promise<AxiosResponse<T>> {
    const effectiveServiceId = serviceId || config?.serviceId;
    if (!effectiveServiceId) {
      throw new IntegrationException('Service ID is required for HTTP GET request.', 'HttpClientService');
    }
    return this.request<T>({ ...config, method: 'GET', url }, effectiveServiceId);
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfigExt,
    serviceId?: ExternalServiceId,
  ): Promise<AxiosResponse<T>> {
    const effectiveServiceId = serviceId || config?.serviceId;
    if (!effectiveServiceId) {
      throw new IntegrationException('Service ID is required for HTTP POST request.', 'HttpClientService');
    }
    return this.request<T>({ ...config, method: 'POST', url, data }, effectiveServiceId);
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfigExt,
    serviceId?: ExternalServiceId,
  ): Promise<AxiosResponse<T>> {
     const effectiveServiceId = serviceId || config?.serviceId;
    if (!effectiveServiceId) {
      throw new IntegrationException('Service ID is required for HTTP PUT request.', 'HttpClientService');
    }
    return this.request<T>({ ...config, method: 'PUT', url, data }, effectiveServiceId);
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfigExt,
    serviceId?: ExternalServiceId,
  ): Promise<AxiosResponse<T>> {
    const effectiveServiceId = serviceId || config?.serviceId;
    if (!effectiveServiceId) {
      throw new IntegrationException('Service ID is required for HTTP DELETE request.', 'HttpClientService');
    }
    return this.request<T>({ ...config, method: 'DELETE', url }, effectiveServiceId);
  }

  private normalizeError(error: AxiosError, serviceName: ExternalServiceId | string): HttpException {
    const service = typeof serviceName === 'string' ? serviceName : ExternalServiceId[serviceName];
    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message || (data as any)?.error?.message || error.message;
      const errorCode = (data as any)?.errorCode || (data as any)?.error?.code;

      switch (status) {
        case 401:
        case 403:
          return new ExternalServiceAuthenticationException(service, message, error);
        case 429:
          const retryAfter = error.response.headers['retry-after'];
          return new RateLimitExceededException(
            service,
            message,
            retryAfter ? parseInt(retryAfter, 10) : undefined,
            error,
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new ExternalServiceUnavailableException(service, message, error);
        default:
          return new IntegrationException(
            message,
            service,
            status,
            error,
            errorCode,
          );
      }
    } else if (error.request) {
      // Network error, timeout, etc.
      return new ExternalServiceUnavailableException(
        service,
        'No response received from external service. It might be down or a network issue occurred.',
        error,
      );
    }
    // Should not happen often, but covering generic errors
    return new IntegrationException(
        error.message || 'An unexpected error occurred during integration.',
        service,
        HttpStatus.INTERNAL_SERVER_ERROR,
        error
    );
  }
}
```