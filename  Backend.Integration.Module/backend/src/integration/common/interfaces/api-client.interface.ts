/**
 * @file api-client.interface.ts
 * @description Generic interface for an API client, defining common methods for interacting with external services.
 * @namespace AdManager.Platform.Backend.Integration.Common.Interfaces
 */

export interface IApiClient {
  /**
   * Performs a GET request.
   * @template T The expected response type.
   * @param {string} path The URL path for the request.
   * @param {any} [config] Optional request configuration.
   * @returns {Promise<T>} A promise that resolves with the response data.
   */
  get<T>(path: string, config?: any): Promise<T>;

  /**
   * Performs a POST request.
   * @template T The expected response type.
   * @param {string} path The URL path for the request.
   * @param {any} [data] The data to send in the request body.
   * @param {any} [config] Optional request configuration.
   * @returns {Promise<T>} A promise that resolves with the response data.
   */
  post<T>(path: string, data?: any, config?: any): Promise<T>;

  /**
   * Performs a PUT request.
   * @template T The expected response type.
   * @param {string} path The URL path for the request.
   * @param {any} [data] The data to send in the request body.
   * @param {any} [config] Optional request configuration.
   * @returns {Promise<T>} A promise that resolves with the response data.
   */
  put<T>(path: string, data?: any, config?: any): Promise<T>;

  /**
   * Performs a DELETE request.
   * @template T The expected response type.
   * @param {string} path The URL path for the request.
   * @param {any} [config] Optional request configuration.
   * @returns {Promise<T>} A promise that resolves with the response data.
   */
  delete<T>(path: string, config?: any): Promise<T>;
}