```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { CoreConfigService } from '../config.service';
import { ISecretsService } from './secrets.interface';
import { SECRETS_MANAGER_CLIENT } from './secrets.module';
import { ICacheService } from '../../cache/cache.interface'; // For distributed caching if preferred over in-memory

interface ICachedSecret<T> {
  value: T;
  expiresAt: number;
}

/**
 * @class SecretsService
 * @description Service responsible for retrieving secrets from AWS Secrets Manager.
 * It uses the AWS SDK and implements an in-memory caching strategy for fetched secrets
 * to reduce latency and cost.
 * REQ-16-020, REQ-16-040, REQ-14-013, REQ-15-004
 */
@Injectable()
export class SecretsService implements ISecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private readonly inMemorySecretCache = new Map<string, ICachedSecret<any>>();

  constructor(
    @Inject(SECRETS_MANAGER_CLIENT)
    private readonly secretsManagerClient: SecretsManagerClient,
    private readonly coreConfigService: CoreConfigService,
    // @Inject(ICacheService) private readonly cacheService: ICacheService, // Optional: for distributed cache
  ) {}

  /**
   * Retrieves a secret from AWS Secrets Manager.
   * Implements in-memory caching with a configurable TTL.
   * @param secretName - The name or ARN of the secret.
   * @param options - Options for parsing JSON and forcing refresh.
   * @returns The secret value, optionally parsed as JSON.
   */
  async getSecret<T>(
    secretName: string,
    options?: { parseJson?: boolean; forceRefresh?: boolean },
  ): Promise<T> {
    const parseJson = options?.parseJson ?? true; // Default to parsing JSON
    const forceRefresh = options?.forceRefresh ?? false;
    const cacheKey = `${secretName}_${parseJson}`;

    if (!forceRefresh) {
      const cachedEntry = this.inMemorySecretCache.get(cacheKey);
      if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
        this.logger.debug(`Returning cached secret for: ${secretName}`);
        return cachedEntry.value as T;
      }
    }

    this.logger.debug(`Fetching secret from AWS Secrets Manager: ${secretName}`);
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.secretsManagerClient.send(command);

      let secretValue: string | undefined;
      if (response.SecretString) {
        secretValue = response.SecretString;
      } else if (response.SecretBinary) {
        // For binary secrets, decode from base64.
        // This example assumes string secrets, adjust if binary is common.
        secretValue = Buffer.from(response.SecretBinary).toString('utf-8');
      }

      if (secretValue === undefined) {
        this.logger.error(`Secret value is undefined for: ${secretName}`);
        throw new Error(`Secret value is undefined for: ${secretName}`);
      }

      const ttlSeconds = this.coreConfigService.getSecretsCacheTTLSeconds();
      const expiresAt = Date.now() + ttlSeconds * 1000;

      if (parseJson) {
        try {
          const parsedValue = JSON.parse(secretValue) as T;
          this.inMemorySecretCache.set(cacheKey, { value: parsedValue, expiresAt });
          return parsedValue;
        } catch (error) {
          this.logger.error(
            `Failed to parse JSON for secret: ${secretName}`,
            error.stack,
          );
          throw new Error(
            `Failed to parse JSON for secret: ${secretName}. Error: ${error.message}`,
          );
        }
      } else {
        // Treat as plain string
        this.inMemorySecretCache.set(cacheKey, { value: secretValue, expiresAt });
        return secretValue as unknown as T; // Casting for non-JSON scenario
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve secret: ${secretName}. Error: ${error.message}`,
        error.stack,
      );
      // Rethrow or handle more gracefully depending on requirements
      throw error;
    }
  }
}
```