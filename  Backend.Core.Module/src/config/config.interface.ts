/**
 * @file Interface defining the structure of the application's configuration object.
 * @namespace AdManager.Platform.Backend.Core.Config
 */

export interface IAppConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test' | 'staging';
  PORT: number;
  API_GLOBAL_PREFIX?: string; // e.g., 'api'

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID?: string; // Optional, for local dev if not using IAM roles
  AWS_SECRET_ACCESS_KEY?: string; // Optional, for local dev
  AWS_SESSION_TOKEN?: string; // Optional, for local dev or temporary credentials

  // Database (PostgreSQL - TypeORM)
  DB_TYPE: 'postgres';
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_DATABASE: string;
  DB_PASSWORD_SECRET_NAME: string; // Name of the secret in Secrets Manager for DB password
  DB_SYNCHRONIZE: boolean; // Should be false in production
  DB_LOGGING: ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration')[];
  DB_SSL_ENABLED: boolean;
  DB_SSL_REJECT_UNAUTHORIZED?: boolean; // For self-signed certs in dev
  DB_SSL_CA_SECRET_NAME?: string; // Secret name for CA cert if needed

  // Database (DynamoDB)
  DYNAMODB_ENABLE_LOCAL: boolean;
  DYNAMODB_LOCAL_ENDPOINT?: string;
  // Table names can be dynamic or defined here, e.g.:
  // DYNAMODB_TABLE_AUDIT_LOGS: string;

  // Cache (Redis)
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD_SECRET_NAME?: string; // Name of the secret for Redis password
  REDIS_TLS_ENABLED: boolean;
  DEFAULT_CACHE_TTL_SECONDS: number;
  SECRETS_CACHE_TTL_SECONDS: number;

  // Logging (Pino)
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  LOG_REDACTION_PATHS: string[]; // e.g., ['req.headers.authorization', 'body.password']

  // Tracing (AWS X-Ray)
  XRAY_DAEMON_ADDRESS: string; // e.g., '127.0.0.1:2000'
  XRAY_CONTEXT_MISSING_STRATEGY: 'LOG_ERROR' | 'RUNTIME_ERROR'; // How to handle missing context
  ENABLE_XRAY_TRACING: boolean;
  ENABLE_XRAY_TRACING_FULL?: boolean; // for AWS SDK patching (REQ-SDS)

  // SQS
  // Example: SQS_MY_QUEUE_URL: string;
  // Or a more generic way to get queue URLs based on name

  // S3
  S3_DEFAULT_BUCKET: string;
  S3_ASSETS_BUCKET_NAME: string;
  S3_LOGS_BUCKET_NAME: string;
  S3_BACKUPS_BUCKET_NAME: string;
  S3_DEFAULT_SSE_ALGORITHM: 'AES256' | 'aws:kms'; // REQ-15-002, REQ-16-012
  S3_KMS_KEY_ID?: string; // Required if S3_DEFAULT_SSE_ALGORITHM is 'aws:kms'

  // HTTP Client
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: number; // REQ-15-003

  // Feature Flags (e.g., AWS AppConfig)
  APPCONFIG_APPLICATION_ID?: string;
  APPCONFIG_ENVIRONMENT_ID?: string;
  APPCONFIG_PROFILE_ID?: string;
  // Specific feature flags, or loaded dynamically by FeatureFlagsService
  FEATURE_FLAG_ENABLE_ADVANCED_LOGGING_DETAILS?: boolean;
  FEATURE_FLAG_USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG?: boolean;
  FEATURE_FLAG_ENABLE_DYNAMODB_LOCAL_ENDPOINT?: boolean;
  FEATURE_FLAG_ENABLE_REDIS_CACHE_DETAILED_LOGGING?: boolean;

  // Security
  CORS_ORIGIN: string[] | string | boolean; // For CORS configuration
  HELMET_CONFIG?: Record<string, any>; // Configuration for Helmet middleware
}