```typescript
import { RedisOptions } from 'ioredis';
import { CoreConfigService } from '../config/config.service';
import { ISecretsService } from '../config/secrets/secrets.interface';

/**
 * Configuration factory for the `ioredis` (Redis) client.
 * @param configService - The core configuration service.
 * @param secretsService - The secrets management service.
 * @returns A promise resolving to `RedisOptions` for `ioredis`.
 */
export const redisConfigFactory = async (
  configService: CoreConfigService,
  secretsService: ISecretsService,
): Promise<RedisOptions> => {
  const host = configService.getRedisHost();
  const port = configService.getRedisPort();

  // REQ-14-012: Redis password should be fetched from Secrets Manager
  const password = await secretsService.getSecret<string>(
    'REDIS_PASSWORD_SECRET_NAME', // Replace with actual secret name/ARN
  );

  const tlsOptions = configService.isRedisTlsEnabled()
    ? {} // For ElastiCache with in-transit encryption, ioredis usually handles TLS by default if host is *.cache.amazonaws.com
      // Specific CA or certs might be needed for other setups: { ca: 'path/to/ca.crt' }
    : undefined;

  if (!host || !port) {
    throw new Error('Redis host or port is not configured.');
  }

  const options: RedisOptions = {
    host,
    port,
    password,
    tls: tlsOptions,
    // REQ-11-010, REQ-16-010: Handle connection errors and readiness events
    // ioredis handles retries by default. Configure retryStrategy if custom behavior is needed.
    // e.g., retryStrategy: (times) => Math.min(times * 50, 2000),
    // Event listeners for 'error', 'ready', 'connect' can be added on the client instance in CacheService or CacheModule.
    // Lazy connect can be useful to prevent app hanging on startup if Redis is down.
    lazyConnect: true,
    // Show friendly error events on the console
    showFriendlyErrorStack: configService.getNodeEnv() === 'development',
    // Keep a connection alive, especially useful for Lambda or long-running tasks.
    keepAlive: 30000, // Send a PING every 30 seconds
    // Connection timeout
    connectTimeout: 10000, // 10 seconds
  };

  // TODO: REQ-15-002 might apply if ElastiCache has specific TLS version requirements beyond default.
  // ioredis uses Node.js's `tls.connect`, which should use secure defaults.

  return options;
};
```