```typescript
import { RedisOptions } from 'ioredis';
import { CoreConfigService } from '../config/config.service';
import { ISecretsService } from '../config/secrets/secrets.interface';

/**
 * @function redisConfigFactory
 * @description Configuration factory for `ioredis` (Redis client).
 * Retrieves Redis connection details (host, port, password) from `CoreConfigService` and `SecretsService`.
 * Configures TLS options for connecting to Amazon ElastiCache with in-transit encryption.
 * REQ-11-010, REQ-16-010, REQ-14-012, REQ-15-002
 * @param coreConfigService - Service for accessing general application configuration.
 * @param secretsService - Service for retrieving secrets like Redis passwords.
 * @returns A promise resolving to RedisOptions for ioredis.
 */
export const redisConfigFactory = async (
  coreConfigService: CoreConfigService,
  secretsService: ISecretsService,
): Promise<RedisOptions> => {
  const host = coreConfigService.getRedisHost();
  const port = coreConfigService.getRedisPort();
  const tlsEnabled = coreConfigService.getRedisTlsEnabled();
  const passwordSecretName = coreConfigService.getRedisPasswordSecretName();

  let password: string | undefined;
  if (passwordSecretName) {
    try {
      // Assuming the secret value is the password string directly
      password = await secretsService.getSecret<string>(passwordSecretName, { parseJson: false });
    } catch (error) {
      console.error(`Failed to retrieve Redis password from Secrets Manager (secret: ${passwordSecretName}):`, error);
      // Depending on policy, might throw or proceed without password if allowed for local/dev
      // For now, if secret retrieval fails, connection might fail or attempt without password.
    }
  } else if (process.env.REDIS_PASSWORD) { // Fallback to direct env var if secret name not provided
      password = process.env.REDIS_PASSWORD;
  }

  const redisOptions: RedisOptions = {
    host,
    port,
    password,
    // Recommended ioredis options
    retryStrategy: (times: number): number | null => {
      // Exponential backoff, max 10 retries
      if (times > 10) {
        return null; // Stop retrying
      }
      return Math.min(times * 200, 3000); // Max 3 seconds delay
    },
    maxRetriesPerRequest: 3, // Retry commands up to 3 times
    enableOfflineQueue: true, // Queue commands when offline (up to a limit)
    // lazyConnect: true, // Connect on first command, not on instantiation
    showFriendlyErrorStack: coreConfigService.getNodeEnv() === 'development',
  };

  if (tlsEnabled) {
    redisOptions.tls = {
      // For ElastiCache, typically `servername` should match the primary endpoint if using a self-signed cert or specific CA
      // servername: host, // May not be needed if using standard CAs
      rejectUnauthorized: coreConfigService.getNodeEnv() === 'production', // Enforce valid certs in prod
      // ca: fs.readFileSync('/path/to/ca.crt'), // If using custom CA for ElastiCache
    };
    // For ElastiCache with TLS, sometimes the port might change (e.g., if a proxy is used)
    // Ensure the port from config is correct for TLS.
  }

  return redisOptions;
};
```