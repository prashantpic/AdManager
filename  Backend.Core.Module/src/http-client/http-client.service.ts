import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IHttpClientService } from './http-client.interface';
import { CoreConfigService } from '../config/config.service';

@Injectable()
export class HttpClientService implements IHttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly defaultTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: CoreConfigService,
  ) {
    this.defaultTimeout = this.configService.getHttpClientDefaultTimeoutMs();
  }

  private mapAxiosErrorToHttpException(error: AxiosError): HttpException {
    this.logger.error(`HTTP Request Error: ${error.message}`, error.stack, error.config?.url);
    if (error.response) {
      return new HttpException(
        {
          message: error.response.data || error.message,
          statusCode: error.response.status,
          url: error.config?.url,
        },
        error.response.status,
      );
    } else if (error.request) {
      // The request was made but no response was received
      return new HttpException(
        {
          message: 'No response received from server',
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          url: error.config?.url,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      return new HttpException(
        {
          message: error.message || 'HTTP request setup error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          url: error.config?.url,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.get<T>(url, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async post<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.post<T>(url, data, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async put<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.put<T>(url, data, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.delete<T>(url, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async patch<T, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.patch<T>(url, data, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async head<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.head<T>(url, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }

  async options<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { 
        timeout: this.defaultTimeout,
        ...config 
    };
    return firstValueFrom(
      this.httpService.options<T>(url, requestConfig).pipe(
        catchError((error: AxiosError) =>
          throwError(() => this.mapAxiosErrorToHttpException(error)),
        ),
      ),
    );
  }
}