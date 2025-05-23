/**
 * @file Defines the structure of the application's configuration object.
 * This interface ensures all expected environment variables are documented with their types.
 */

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export interface IAppConfig {
  // Application
  NODE_ENV: NodeEnvironment;
  PORT: number;
  API_PREFIX?: string; // e.g., 'api/v1'

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID?: string; // Optional, IAM roles preferred
  AWS_SECRET_ACCESS_KEY?: string; // Optional, IAM roles preferred
  AWS_SESSION_TOKEN?: string; // Optional, for temporary credentials

  // Database (PostgreSQL - TypeORM)
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USERNAME: string;
  // DATABASE_PASSWORD will be fetched from Secrets Manager, so not directly here.
  DATABASE_NAME: string;
  DATABASE_SSL_ENABLED: boolean; // For RDS SSL connection
  DATABASE_LOGGING_ENABLED: boolean; // TypeORM logging

  // Database (DynamoDB)
  DYNAMODB_TABLE_PREFIX?: string;
  DYNAMODB_ENDPOINT_URL?: string; // For local development with DynamoDB Local
  ENABLE_DYNAMODB_LOCAL_ENDPOINT?: boolean; // Feature flag for DynamoDB local

  // Cache (Redis - ioredis)
  REDIS_HOST: string;
  REDIS_PORT: number;
  // REDIS_PASSWORD will be fetched from Secrets Manager.
  REDIS_TLS_ENABLED: boolean; // For ElastiCache with in-transit encryption
  DEFAULT_CACHE_TTL_SECONDS: number;
  ENABLE_REDIS_CACHE_DETAILED_LOGGING?: boolean; // Feature flag for Redis logging

  // Secrets Management
  SECRETS_MANAGER_DB_CREDENTIALS_NAME: string;
  SECRETS_MANAGER_REDIS_PASSWORD_NAME?: string;
  SECRETS_CACHE_TTL_SECONDS: number;

  // Logging (Pino)
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  LOG_REDACTION_PATHS: string[]; // Array of paths to redact, e.g., 'req.headers.authorization'
  ENABLE_ADVANCED_LOGGING_DETAILS?: boolean; // Feature flag for more verbose logging

  // Tracing (AWS X-Ray)
  ENABLE_XRAY_TRACING: boolean;
  ENABLE_XRAY_TRACING_FULL?: boolean; // Feature flag for detailed X-Ray tracing (e.g., AWS SDK calls)

  // Messaging (SQS)
  SQS_EXAMPLE_QUEUE_URL: string; // Example, actual queues will be module-specific
  SQS_ENDPOINT_URL?: string; // For local development with local SQS (e.g. ElasticMQ)

  // Storage (S3)
  S3_ASSETS_BUCKET_NAME: string;
  S3_LOGS_BUCKET_NAME: string;
  S3_BACKUPS_BUCKET_NAME: string;
  S3_DEFAULT_SSE_ALGORITHM: 'AES256' | 'aws:kms'; // REQ-15-002, REQ-16-012
  S3_KMS_KEY_ID?: string; // Required if S3_DEFAULT_SSE_ALGORITHM is 'aws:kms'
  S3_ENDPOINT_URL?: string; // For local development with MinIO or LocalStack

  // HTTP Client (Axios)
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: number; // REQ-15-003

  // Feature Flags (e.g., AWS AppConfig)
  FEATURE_FLAG_APPCONFIG_APP_ID?: string;
  FEATURE_FLAG_APPCONFIG_ENV_ID?: string;
  FEATURE_FLAG_APPCONFIG_PROFILE_ID?: string;
  FEATURE_FLAG_POLL_INTERVAL_SECONDS?: number;

  // Parameter Store
  USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG?: boolean; // REQ-16-020
  PARAMETER_STORE_PATH_PREFIX?: string; // e.g., /admanager/prod/

  // Security
  CORS_ORIGIN?: string | string[]; // CORS configuration
  HELMET_ENABLED?: boolean; // For security headers via Helmet
}