/**
 * @file Interface defining the contract for the SecretsService.
 * Specifies methods for retrieving secrets.
 */
export interface ISecretsService {
  /**
   * Retrieves a secret by its name from AWS Secrets Manager.
   *
   * @template T The expected type of the secret value (if parsed as JSON).
   * @param secretName The name or ARN of the secret.
   * @param options Optional configuration for retrieval.
   * @param options.parseJson If true, attempts to parse the secret string as JSON. Defaults to false.
   * @param options.forceRefresh If true, bypasses any cache and fetches directly from Secrets Manager. Defaults to false.
   * @returns A promise that resolves to the secret value (parsed as T if parseJson is true, otherwise string),
   *          or throws an error if the secret cannot be retrieved.
   */
  getSecret<T = string>(
    secretName: string,
    options?: { parseJson?: boolean; forceRefresh?: boolean },
  ): Promise<T>;
}

export const SECRETS_SERVICE = Symbol('ISecretsService');