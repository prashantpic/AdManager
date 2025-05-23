import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IHttpClientService } from './http-client.interface'; // Assuming this interface exists
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

  private async request<T>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const finalConfig: AxiosRequestConfig = {
      timeout: this.defaultTimeout,
      ...config, // User-provided config overrides defaults
    };

    this.logger.debug(
      `Making HTTP ${finalConfig.method?.toUpperCase()} request to ${finalConfig.url}`,
    );

    return firstValueFrom(
      this.httpService.request<T>(finalConfig).pipe(
        catchError((error: AxiosError) => {
          const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
          const message =
            error.response?.data || error.message || 'HTTP Request Failed';
          this.logger.error(
            `HTTP request to ${finalConfig.url} failed with status ${status}:`,
            message,
          );
          return throwError(
            () => new HttpException(message, status, { cause: error }),
          );
        }),
      ),
    );
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async head<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'HEAD', url });
  }

  async options<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'OPTIONS', url });
  }
}