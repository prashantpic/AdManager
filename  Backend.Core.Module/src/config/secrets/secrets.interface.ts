/**
 * @description Interface defining the contract for the SecretsService.
 * It specifies methods for retrieving secrets securely from a secret management system.
 */
export interface ISecretsService {
  /**
   * Retrieves a secret by its name.
   * @param secretName The identifier of the secret to retrieve.
   * @param options Optional parameters for retrieval.
   * @returns A promise that resolves to the secret value.
   *          If `parseJson` is true in options, the secret string is parsed as JSON,
   *          and the promise resolves to the parsed object of type T.
   *          Otherwise, or if `parseJson` is false/undefined, it resolves to the secret string.
   */
  getSecret<T = string>(
    secretName: string,
    options?: { parseJson?: boolean; forceRefresh?: boolean },
  ): Promise<T>;
}

export const ISecretsService = Symbol('ISecretsService');