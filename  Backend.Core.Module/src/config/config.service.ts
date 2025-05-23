```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService as NestJsConfigService } from '@nestjs/config';
import { IAppConfig, NodeEnv } from './config.interface'; // Assuming IAppConfig and NodeEnv are in config.interface.ts

/**
 * @class CoreConfigService
 * @description Service to access strongly-typed application configuration values.
 * Wraps the NestJS `ConfigService` to provide convenient getter methods for
 * specific configuration properties defined in `IAppConfig`.
 * REQ-16-020
 */
@Injectable()
export class CoreConfigService {
  constructor(
    private readonly nestJsConfigService: NestJsConfigService<IAppConfig, true>,
  ) {}

  /**
   * Generic getter for any configuration key.
   * @param key - The configuration key.
   * @returns The configuration value.
   */
  get<T extends keyof IAppConfig>(key: T): IAppConfig[T] {
    return this.nestJsConfigService.get<IAppConfig[T]>(key, { infer: true });
  }

  // Specific Getters as per SDS Section 5.1 CoreConfigService

  getPort(): number {
    return this.get('PORT');
  }

  getNodeEnv(): NodeEnv {
    return this.get('NODE_ENV');
  }

  getDatabaseUrl(): string {
    // This might be a composed secret or directly from env.
    // If it's a secret ARN, SecretsService would be used elsewhere to resolve it.
    // Assuming DATABASE_URL is a direct env var for now, or handled by TypeORM config factory.
    return this.get('DATABASE_URL');
  }

  getRedisUrl(): string {
    // Similar to DATABASE_URL, could be direct or an ARN for Secrets Manager.
    return this.get('REDIS_URL');
  }

  getAwsRegion(): string {
    return this.get('AWS_REGION');
  }

  getSqsQueueUrl(queueName: string): string {
    // Example: queues are defined as SQS_QUEUE_USER_SERVICE, SQS_QUEUE_ORDER_SERVICE
    // This getter could construct it or look up a specific key.
    // For simplicity, let's assume a pattern or direct lookup.
    const queueKey = `SQS_QUEUE_${queueName.toUpperCase()}_URL` as keyof IAppConfig;
    if (this.has(queueKey)) {
      return this.get(queueKey as any); // Type assertion needed due to dynamic key
    }
    // Fallback or specific logic if queues are named differently in IAppConfig
    // Example: return `https://sqs.${this.getAwsRegion()}.amazonaws.com/ACCOUNT_ID/${queueName}`;
    // For now, direct lookup.
    const directQueueUrl = this.get(queueName as keyof IAppConfig); // if queueName is a direct key in IAppConfig
    if (directQueueUrl) return directQueueUrl as string;

    throw new Error(`SQS Queue URL for "${queueName}" not found in configuration.`);
  }

  getS3BucketName(bucketType: 'assets' | 'logs' | 'backups'): string {
    const key = `S3_BUCKET_${bucketType.toUpperCase()}` as keyof IAppConfig;
     if (this.has(key)) {
      return this.get(key as any);
    }
    throw new Error(`S3 Bucket Name for type "${bucketType}" not found in configuration.`);
  }

  getSecretsCacheTTLSeconds(): number {
    return this.get('SECRETS_CACHE_TTL_SECONDS');
  }

  // getFeatureFlag(key: string): boolean { // This is usually handled by FeatureFlagsService
  //   // Feature flags might be loaded into IAppConfig or fetched dynamically.
  //   // Assuming they are part of IAppConfig for this getter.
  //   const flagKey = `FEATURE_${key.toUpperCase()}` as keyof IAppConfig;
  //   return this.get(flagKey) as unknown as boolean; // Be cautious with direct casting
  // }

  getS3DefaultSseAlgorithm(): string | undefined { // REQ-15-002 mentions S3_DEFAULT_SSE_ALGORITHM
    return this.get('S3_DEFAULT_SSE_ALGORITHM');
  }

  getHttpClientDefaultTimeoutMs(): number { // REQ-15-003 mentions HTTP_CLIENT_DEFAULT_TIMEOUT_MS
    return this.get('HTTP_CLIENT_DEFAULT_TIMEOUT_MS');
  }

  getLogRedactionPaths(): string[] { // REQ-16-026 mentions LOG_REDACTION_PATHS
    const paths = this.get('LOG_REDACTION_PATHS');
    if (typeof paths === 'string') {
      return paths.split(',').map(p => p.trim());
    }
    return Array.isArray(paths) ? paths : [];
  }

  getLogLevel(): string {
    return this.get('LOG_LEVEL');
  }

  getDefaultCacheTtlSeconds(): number {
    return this.get('DEFAULT_CACHE_TTL_SECONDS');
  }

  // Helper to check if a key exists, useful for optional configurations
  has(key: keyof IAppConfig): boolean {
    return this.nestJsConfigService.get(key) !== undefined;
  }

  // Feature flag related getters for AppConfig integration (if flags are in IAppConfig)
  getAppConfigApplicationId(): string | undefined {
    return this.get('APPCONFIG_APPLICATION_ID');
  }

  getAppConfigEnvironmentId(): string | undefined {
    return this.get('APPCONFIG_ENVIRONMENT_ID');
  }

  getAppConfigProfileId(): string | undefined {
    return this.get('APPCONFIG_PROFILE_ID');
  }

  // Database specific getters (used by TypeORM config factory)
  getDatabaseHost(): string { return this.get('DB_HOST'); }
  getDatabasePort(): number { return this.get('DB_PORT'); }
  getDatabaseUsername(): string { return this.get('DB_USERNAME'); }
  getDatabasePasswordSecretName(): string { return this.get('DB_PASSWORD_SECRET_NAME'); } // ARN or name
  getDatabaseName(): string { return this.get('DB_NAME'); }
  getDatabaseSslEnabled(): boolean { return this.get('DB_SSL_ENABLED'); }

  // Redis specific getters (used by Redis config factory)
  getRedisHost(): string { return this.get('REDIS_HOST'); }
  getRedisPort(): number { return this.get('REDIS_PORT'); }
  getRedisPasswordSecretName(): string | undefined { return this.get('REDIS_PASSWORD_SECRET_NAME'); } // ARN or name
  getRedisTlsEnabled(): boolean { return this.get('REDIS_TLS_ENABLED'); }

  // X-Ray Tracing
  isXRayEnabled(): boolean {
    return this.get('XRAY_ENABLED');
  }

  // DynamoDB local endpoint
  getDynamoDBLocalEndpoint(): string | undefined {
    return this.get('DYNAMODB_LOCAL_ENDPOINT');
  }
  isDynamoDBLocalEndpointEnabled(): boolean {
    return !!this.get('DYNAMODB_LOCAL_ENDPOINT');
  }
}
```