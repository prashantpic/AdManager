```typescript
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * @interface IHttpClientService
 * @description Defines the contract for a generic HTTP client service,
 * specifying methods for various HTTP request types and configuration options.
 */
export interface IHttpClientService {
  /**
   * Performs a GET request.
   * @template T The expected type of the response data.
   * @param url The URL to request.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;

  /**
   * Performs a POST request.
   * @template T The expected type of the response data.
   * @param url The URL to request.
   * @param data Optional data to send in the request body.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;

  /**
   * Performs a PUT request.
   * @template T The expected type of the response data.
   * @param url The URL to request.
   * @param data Optional data to send in the request body.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;

  /**
   * Performs a DELETE request.
   * @template T The expected type of the response data.
   * @param url The URL to request.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;

  /**
   * Performs a PATCH request.
   * @template T The expected type of the response data.
   * @param url The URL to request.
   * @param data Optional data to send in the request body.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;

  /**
   * Performs a HEAD request.
   * @param url The URL to request.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse (typically only headers).
   */
  head(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;

  /**
   * Performs an OPTIONS request.
   * @param url The URL to request.
   * @param config Optional Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  options(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;

  /**
   * A generic request method.
   * @template T The expected type of the response data.
   * @param config The Axios request configuration.
   * @returns A promise that resolves to an AxiosResponse.
   */
  request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
}

/**
 * Token for injecting the HttpClientService.
 */
export const IHttpClientService = Symbol('IHttpClientService');

/**
 * Utility type for typed Axios errors.
 */
export type TypedAxiosError<T = any, D = any> = AxiosError<T, D>;
```