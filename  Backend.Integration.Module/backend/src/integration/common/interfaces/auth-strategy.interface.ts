/**
 * @file auth-strategy.interface.ts
 * @description Interface for different authentication strategies (e.g., OAuth2, API Key) for external services.
 * @pattern Strategy
 * @namespace AdManager.Platform.Backend.Integration.Common.Interfaces
 */

export interface IAuthStrategy {
  /**
   * Gets the authentication headers required for an API call to an external service.
   * @param {string} [merchantId] Optional merchant ID, if authentication is merchant-specific.
   * @param {any} [serviceConfig] Optional service-specific configuration needed for authentication.
   * @returns {Promise<Record<string, string>>} A promise that resolves with an object containing HTTP headers for authentication.
   * @requirement REQ-11-004
   */
  getAuthHeaders(
    merchantId?: string,
    serviceConfig?: any,
  ): Promise<Record<string, string>>;
}