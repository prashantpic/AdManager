export type NodeEnv = 'development' | 'production' | 'test' | 'staging';
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
export type S3SSEAlgorithm = 'AES256' | 'aws:kms';
export type TypeOrmLogLevel = 'query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration';


/**
 * @description Interface defining the structure of the application's configuration.
 * These are typically sourced from environment variables and validated on startup.
 */
export interface IAppConfig {
  // Application Core
  NODE_ENV: NodeEnv;
  PORT: number;

  // Logging
  LOG_LEVEL: LogLevel;
  LOG_REDACTION_PATHS: string[]; // Comma-separated string from env, parsed to array
  ENABLE_ADVANCED_LOGGING_DETAILS: boolean;

  // AWS General
  AWS_REGION: string;
  AWS_ACCOUNT_ID?: string; // Optional, but useful for some ARN constructions

  // Secrets Management
  SECRETS_MANAGER_ENDPOINT_URL?: string; // For local testing with localstack/moto
  SECRETS_CACHE_TTL_SECONDS: number;

  // Parameter Store (for non-sensitive config)
  USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG: boolean;
  SSM_PARAMETER_PREFIX?: string; // e.g., /<app-name>/<env>/

  // Database - TypeORM (PostgreSQL)
  DB_HOST_SECRET_NAME: string;
  DB_PORT_SECRET_NAME: string;
  DB_USERNAME_SECRET_NAME: string;
  DB_PASSWORD_SECRET_NAME: string;
  DB_NAME_SECRET_NAME: string;
  DB_CONNECTION_POOL_SIZE?: number; // max connections
  DB_CONNECTION_TIMEOUT_MS?: number;
  TYPEORM_SYNCHRONIZE: boolean; // Should be false in production
  TYPEORM_LOGGING: TypeOrmLogLevel[] | boolean; // e.g., ['query', 'error'] or true/false
  TYPEORM_MIGRATIONS_RUN: boolean;
  TYPEORM_SSL_REJECT_UNAUTHORIZED: boolean; // For RDS SSL

  // Database - DynamoDB
  DYNAMODB_ENDPOINT_URL?: string; // For local development with DynamoDB Local
  ENABLE_DYNAMODB_LOCAL_ENDPOINT: boolean;
  // Table names would typically be here or constructed by services
  // EXAMPLE_DYNAMODB_TABLE_NAME: string;

  // Caching - Redis (ElastiCache)
  REDIS_HOST_SECRET_NAME: string;
  REDIS_PORT_SECRET_NAME: string;
  REDIS_PASSWORD_SECRET_NAME?: string; // If password protected
  REDIS_USE_TLS: boolean; // For ElastiCache in-transit encryption
  DEFAULT_CACHE_TTL_SECONDS: number;
  ENABLE_REDIS_CACHE_DETAILED_LOGGING: boolean;

  // Messaging - SQS
  SQS_ENDPOINT_URL?: string; // For local testing with localstack
  SQS_QUEUE_URL_PREFIX?: string; // e.g., https://sqs.us-east-1.amazonaws.com/123456789012/
  // Specific queue names/URLs might be added here or derived
  // EXAMPLE_SQS_QUEUE_NAME: string;

  // Storage - S3
  S3_ENDPOINT_URL?: string; // For local testing with localstack/minio
  S3_DEFAULT_SSE_ALGORITHM?: S3SSEAlgorithm; // e.g., AES256 or aws:kms
  S3_DEFAULT_BUCKET_NAME: string;
  S3_ASSETS_BUCKET_NAME: string;
  S3_LOGS_BUCKET_NAME: string;
  S3_BACKUPS_BUCKET_NAME: string;
  S3_PRESIGNED_URL_EXPIRATION_SECONDS: number;

  // HTTP Client
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: number;
  HTTP_CLIENT_MAX_REDIRECTS?: number;

  // Tracing - AWS X-Ray
  ENABLE_XRAY_TRACING: boolean; // General toggle for X-Ray
  ENABLE_XRAY_TRACING_FULL: boolean; // For AWS SDK call patching

  // Feature Flags - AWS AppConfig
  ENABLE_FEATURE_FLAGS: boolean;
  FEATURE_FLAGS_APPCONFIG_APP_ID?: string;
  FEATURE_FLAGS_APPCONFIG_ENV_ID?: string;
  FEATURE_FLAGS_APPCONFIG_PROFILE_ID?: string;
  FEATURE_FLAGS_POLL_INTERVAL_SECONDS?: number;
  FEATURE_FLAGS_MAX_AGE_SECONDS?: number; // Cache duration for flags

  // Security
  CORS_ORIGIN: string | string[] | boolean; // Comma-separated string from env, or boolean
  GLOBAL_PREFIX?: string; // e.g., 'api/v1'

  // Add other application-specific configurations as needed
  API_KEY_SECRET_NAME?: string; // Example for an external service API key
}