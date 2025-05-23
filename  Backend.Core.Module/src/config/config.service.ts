```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// TODO: Define IAppConfig in src/config/config.interface.ts and import it.
// This is a minimal placeholder for required properties by other core services.
export interface IAppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  AWS_REGION: string;
  LOG_LEVEL: string;
  LOG_REDACTION_PATHS?: string[];
  SECRETS_CACHE_TTL_SECONDS: number;
  DEFAULT_CACHE_TTL_SECONDS: number;
  S3_DEFAULT_SSE_ALGORITHM: string;
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: number;

  // For TypeORM (potentially from secrets)
  DB_HOST?: string;
  DB_PORT?: number;
  DB_USERNAME?: string;
  DB_DATABASE?: string;
  DB_SSL_REJECT_UNAUTHORIZED?: boolean;
  DB_CA_CERT?: string;
  TYPEORM_LOGGING?: boolean; // Example TypeORM specific config

  // For Redis (potentially from secrets)
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_TLS_ENABLED?: boolean;

  // For SQS
  SQS_QUEUE_URL_PREFIX?: string; // Example: https://sqs.us-east-1.amazonaws.com/123456789012/

  // For S3
  S3_ASSETS_BUCKET_NAME?: string;

  // For DynamoDB
  DYNAMODB_LOCAL_ENDPOINT?: string;
  ENABLE_DYNAMODB_LOCAL_ENDPOINT?: boolean;

  // Feature Flags (AppConfig)
  APPCONFIG_APPLICATION_ID?: string;
  APPCONFIG_ENVIRONMENT_ID?: string;
  APPCONFIG_PROFILE_ID?: string;

  // Add other specific config properties as needed by the application
  [key: string]: any; // Allow for other keys if not strictly typed here
}

/**
 * @Injectable CoreConfigService
 * @description Service to access strongly-typed application configuration values.
 * Wraps the NestJS `ConfigService` to provide convenient getter methods for
 * specific configuration properties defined in `IAppConfig`.
 */
@Injectable()
export class CoreConfigService {
  constructor(private readonly nestConfigService: ConfigService<IAppConfig, true>) {}

  /**
   * Generic getter for any configuration key.
   * @param key - The configuration key.
   * @returns The configuration value.
   */
  get<T extends keyof IAppConfig>(key: T): IAppConfig[T] {
    return this.nestConfigService.get<IAppConfig[T]>(key as any); // Cast as any because ConfigService's key type is string
  }

  getOrThrow<T extends keyof IAppConfig>(key: T): NonNullable<IAppConfig[T]> {
    const value = this.nestConfigService.get<IAppConfig[T]>(key as any);
    if (value === undefined || value === null) {
      throw new Error(`Configuration missing for key: ${String(key)}`);
    }
    return value as NonNullable<IAppConfig[T]>;
  }

  getNodeEnv(): IAppConfig['NODE_ENV'] {
    return this.getOrThrow('NODE_ENV');
  }

  getPort(): number {
    return Number(this.getOrThrow('PORT'));
  }

  getAwsRegion(): string {
    return this.getOrThrow('AWS_REGION');
  }

  getLogLevel(): string {
    return this.get('LOG_LEVEL') || 'info';
  }

  getLogRedactionPaths(): string[] {
    const paths = this.get('LOG_REDACTION_PATHS');
    if (typeof paths === 'string') {
        return paths.split(',');
    }
    return paths || [];
  }

  getSecretsCacheTTLSeconds(): number {
    return Number(this.get('SECRETS_CACHE_TTL_SECONDS') || 300); // Default 5 minutes
  }

  getDefaultCacheTTLSeconds(): number {
    return Number(this.get('DEFAULT_CACHE_TTL_SECONDS') || 3600); // Default 1 hour
  }

  getS3DefaultSseAlgorithm(): string {
    return this.get('S3_DEFAULT_SSE_ALGORITHM') || 'AES256';
  }

  getHttpClientDefaultTimeoutMs(): number {
    return Number(this.get('HTTP_CLIENT_DEFAULT_TIMEOUT_MS') || 5000); // Default 5 seconds
  }

  // Database related getters
  getDbHost(): string | undefined { return this.get('DB_HOST'); }
  getDbPort(): number | undefined { return this.get('DB_PORT') ? Number(this.get('DB_PORT')) : undefined; }
  getDbUsername(): string | undefined { return this.get('DB_USERNAME'); }
  getDbDatabase(): string | undefined { return this.get('DB_DATABASE'); }
  getDbSslRejectUnauthorized(): boolean { return this.get('DB_SSL_REJECT_UNAUTHORIZED') === true || String(this.get('DB_SSL_REJECT_UNAUTHORIZED')).toLowerCase() === 'true'; }
  getDbCaCert(): string | undefined { return this.get('DB_CA_CERT'); }
  getTypeOrmLogging(): boolean { return this.get('TYPEORM_LOGGING') === true || String(this.get('TYPEORM_LOGGING')).toLowerCase() === 'true'; }


  // Redis related getters
  getRedisHost(): string | undefined { return this.get('REDIS_HOST'); }
  getRedisPort(): number | undefined { return this.get('REDIS_PORT') ? Number(this.get('REDIS_PORT')) : undefined; }
  isRedisTlsEnabled(): boolean { return this.get('REDIS_TLS_ENABLED') === true || String(this.get('REDIS_TLS_ENABLED')).toLowerCase() === 'true'; }


  // SQS related getters
  getSqsQueueUrl(queueName: string): string {
    const prefix = this.get('SQS_QUEUE_URL_PREFIX');
    if (prefix) {
        return `${prefix}${queueName}`;
    }
    // Fallback or direct lookup if queue URLs are fully specified in env
    return this.getOrThrow(queueName.toUpperCase() + '_QUEUE_URL' as any);
  }

  // S3 related getters
  getS3BucketName(bucketType: 'assets' | 'logs' | 'backups'): string {
     const key = `S3_${bucketType.toUpperCase()}_BUCKET_NAME` as keyof IAppConfig;
     return this.getOrThrow(key);
  }

  // DynamoDB
  getDynamoDBLocalEndpoint(): string | undefined {
    return this.get('DYNAMODB_LOCAL_ENDPOINT');
  }

  isDynamoDBLocalEndpointEnabled(): boolean {
    return this.get('ENABLE_DYNAMODB_LOCAL_ENDPOINT') === true || String(this.get('ENABLE_DYNAMODB_LOCAL_ENDPOINT')).toLowerCase() === 'true';
  }

  // Feature Flags
  getAppConfigApplicationId(): string | undefined { return this.get('APPCONFIG_APPLICATION_ID'); }
  getAppConfigEnvironmentId(): string | undefined { return this.get('APPCONFIG_ENVIRONMENT_ID'); }
  getAppConfigProfileId(): string | undefined { return this.get('APPCONFIG_PROFILE_ID'); }
}
```