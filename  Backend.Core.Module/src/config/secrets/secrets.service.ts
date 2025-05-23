```typescript
import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput,
  GetSecretValueCommandOutput,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';
import { ISecretsService } from './secrets.interface';
import { CoreConfigService } from '../config.service';
import { SECRETS_MANAGER_CLIENT } from './secrets.module';

interface ICachedSecret<T> {
  value: T;
  fetchedAt: number;
}

/**
 * @Injectable SecretsService
 * @description Service responsible for retrieving secrets from AWS Secrets Manager.
 * It uses the AWS SDK and implements caching strategies for fetched secrets
 * to reduce latency and cost.
 */
@Injectable()
export class SecretsService implements ISecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private readonly cache: Map<string, ICachedSecret<any>> = new Map();
  private readonly cacheTTLMilliseconds: number;

  constructor(
    @Inject(SECRETS_MANAGER_CLIENT)
    private readonly secretsManagerClient: SecretsManagerClient,
    private readonly configService: CoreConfigService,
  ) {
    this.cacheTTLMilliseconds =
      this.configService.getSecretsCacheTTLSeconds() * 1000;
  }

  /**
   * Retrieves a secret from AWS Secrets Manager.
   * @template T The expected type of the secret value (after potential JSON parsing).
   * @param secretName The name or ARN of the secret.
   * @param options Optional configuration for retrieval.
   *   `parseJson`: If true, attempts to parse the secret string as JSON. Defaults to false.
   *   `forceRefresh`: If true, bypasses the cache. Defaults to false.
   * @returns A promise that resolves to the secret value.
   */
  async getSecret<T>(
    secretName: string,
    options?: { parseJson?: boolean; forceRefresh?: boolean },
  ): Promise<T | undefined> {
    const parseJson = options?.parseJson ?? false;
    const forceRefresh = options?.forceRefresh ?? false;
    const cacheKey = `${secretName}:${parseJson}`;

    if (!forceRefresh) {
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && Date.now() - cachedEntry.fetchedAt < this.cacheTTLMilliseconds) {
        this.logger.debug(`Returning cached secret for: ${secretName}`);
        return cachedEntry.value as T;
      }
    }

    this.logger.debug(`Fetching secret from AWS Secrets Manager: ${secretName}`);
    const commandInput: GetSecretValueCommandInput = { SecretId: secretName };

    try {
      const output: GetSecretValueCommandOutput =
        await this.secretsManagerClient.send(
          new GetSecretValueCommand(commandInput),
        );

      if (output.SecretString) {
        let secretValue: string | T = output.SecretString;
        if (parseJson) {
          try {
            secretValue = JSON.parse(output.SecretString) as T;
          } catch (error) {
            this.logger.error(
              `Failed to parse JSON for secret: ${secretName}`,
              error,
            );
            // Depending on requirements, either throw or return undefined/string
            throw new Error(`Failed to parse JSON for secret: ${secretName}`);
          }
        }
        this.cache.set(cacheKey, { value: secretValue, fetchedAt: Date.now() });
        return secretValue as T;
      } else if (output.SecretBinary) {
        // Handle binary secrets if needed, typically by decoding (e.g., base64)
        // For now, assuming string secrets or JSON parsed from string
        this.logger.warn(`Secret ${secretName} is binary, not handled by default getSecret.`);
        // If parseJson was true for a binary secret, this is an issue.
        if (parseJson) {
            throw new Error(`Secret ${secretName} is binary and parseJson was requested.`);
        }
        // If not parsing, return the binary buffer, or undefined if T is not Buffer-like
        // This part needs clarification based on how binary secrets of type T are handled.
        // For now, returning undefined for binary unless T is explicitly Buffer.
        return output.SecretBinary as unknown as T; // May need careful typing
      }
      this.logger.warn(`Secret ${secretName} has no SecretString or SecretBinary.`);
      return undefined;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        this.logger.warn(`Secret not found: ${secretName}`);
        return undefined;
      }
      this.logger.error(
        `Error retrieving secret ${secretName}: ${error.message}`,
        error.stack,
      );
      throw error; // Rethrow other errors
    }
  }
}
```