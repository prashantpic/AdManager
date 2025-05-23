/**
 * @file Interface defining the contract for the SecretsService.
 * @namespace AdManager.Platform.Backend.Core.Config.Secrets
 */

export interface ISecretsService {
  /**
   * Retrieves a secret by its name.
   * @param secretName The name or ARN of the secret.
   * @param options Optional parameters for retrieval.
   * @returns A promise that resolves to the secret value, parsed as T if parseJson is true.
   */
  getSecret<T = string>(
    secretName: string,
    options?: { parseJson?: boolean; forceRefresh?: boolean },
  ): Promise<T>;
}

export const ISecretsService = Symbol('ISecretsService');