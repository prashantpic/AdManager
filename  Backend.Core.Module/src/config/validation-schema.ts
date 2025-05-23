import * as Joi from 'joi';
import { NodeEnv, LogLevel, S3SSEAlgorithm, TypeOrmLogLevel } from './config.interface';

/**
 * @description Validation schema for environment variables using Joi.
 * This schema is used by `@nestjs/config` to validate the environment during application bootstrap.
 * REQ-16-020
 */
export const environmentValidationSchema = Joi.object<Record<keyof import('./config.interface').IAppConfig, Joi.Schema>, true>({
  // Application Core
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development') satisfies Joi.StringSchema<NodeEnv>,
  PORT: Joi.number().default(3000),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info') satisfies Joi.StringSchema<LogLevel>,
  LOG_REDACTION_PATHS: Joi.string().default('req.headers.authorization,res.headers["set-cookie"]'), // Comma-separated
  ENABLE_ADVANCED_LOGGING_DETAILS: Joi.boolean().default(false),

  // AWS General
  AWS_REGION: Joi.string().required(),
  AWS_ACCOUNT_ID: Joi.string().optional(),

  // Secrets Management
  SECRETS_MANAGER_ENDPOINT_URL: Joi.string().uri().optional(),
  SECRETS_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(300), // 5 minutes

  // Parameter Store
  USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG: Joi.boolean().default(false),
  SSM_PARAMETER_PREFIX: Joi.string().when('USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  // Database - TypeORM (PostgreSQL)
  DB_HOST_SECRET_NAME: Joi.string().required(),
  DB_PORT_SECRET_NAME: Joi.string().required(),
  DB_USERNAME_SECRET_NAME: Joi.string().required(),
  DB_PASSWORD_SECRET_NAME: Joi.string().required(),
  DB_NAME_SECRET_NAME: Joi.string().required(),
  DB_CONNECTION_POOL_SIZE: Joi.number().integer().min(1).optional(),
  DB_CONNECTION_TIMEOUT_MS: Joi.number().integer().min(0).optional(),
  TYPEORM_SYNCHRONIZE: Joi.boolean().default(false),
  TYPEORM_LOGGING: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string() // Comma-separated list of TypeOrmLogLevel
    ).default('error'),
  TYPEORM_MIGRATIONS_RUN: Joi.boolean().default(false),
  TYPEORM_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),


  // Database - DynamoDB
  DYNAMODB_ENDPOINT_URL: Joi.string().uri().optional(),
  ENABLE_DYNAMODB_LOCAL_ENDPOINT: Joi.boolean().default(false),
  // EXAMPLE_DYNAMODB_TABLE_NAME: Joi.string().optional(),

  // Caching - Redis (ElastiCache)
  REDIS_HOST_SECRET_NAME: Joi.string().required(),
  REDIS_PORT_SECRET_NAME: Joi.string().required(),
  REDIS_PASSWORD_SECRET_NAME: Joi.string().optional().allow(''),
  REDIS_USE_TLS: Joi.boolean().default(false),
  DEFAULT_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(3600), // 1 hour
  ENABLE_REDIS_CACHE_DETAILED_LOGGING: Joi.boolean().default(false),

  // Messaging - SQS
  SQS_ENDPOINT_URL: Joi.string().uri().optional(),
  SQS_QUEUE_URL_PREFIX: Joi.string().optional(),
  // EXAMPLE_SQS_QUEUE_NAME: Joi.string().optional(),

  // Storage - S3
  S3_ENDPOINT_URL: Joi.string().uri().optional(),
  S3_DEFAULT_SSE_ALGORITHM: Joi.string()
    .valid('AES256', 'aws:kms')
    .optional() satisfies Joi.StringSchema<S3SSEAlgorithm | undefined>,
  S3_DEFAULT_BUCKET_NAME: Joi.string().required(),
  S3_ASSETS_BUCKET_NAME: Joi.string().required(),
  S3_LOGS_BUCKET_NAME: Joi.string().required(),
  S3_BACKUPS_BUCKET_NAME: Joi.string().required(),
  S3_PRESIGNED_URL_EXPIRATION_SECONDS: Joi.number().integer().min(1).default(3600),


  // HTTP Client
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: Joi.number().integer().min(0).default(5000), // 5 seconds
  HTTP_CLIENT_MAX_REDIRECTS: Joi.number().integer().min(0).default(5),

  // Tracing - AWS X-Ray
  ENABLE_XRAY_TRACING: Joi.boolean().default(false),
  ENABLE_XRAY_TRACING_FULL: Joi.boolean().default(false),

  // Feature Flags - AWS AppConfig
  ENABLE_FEATURE_FLAGS: Joi.boolean().default(false),
  FEATURE_FLAGS_APPCONFIG_APP_ID: Joi.string().when('ENABLE_FEATURE_FLAGS', {
    is: true, then: Joi.string().required(), otherwise: Joi.string().optional(),
  }),
  FEATURE_FLAGS_APPCONFIG_ENV_ID: Joi.string().when('ENABLE_FEATURE_FLAGS', {
    is: true, then: Joi.string().required(), otherwise: Joi.string().optional(),
  }),
  FEATURE_FLAGS_APPCONFIG_PROFILE_ID: Joi.string().when('ENABLE_FEATURE_FLAGS', {
    is: true, then: Joi.string().required(), otherwise: Joi.string().optional(),
  }),
  FEATURE_FLAGS_POLL_INTERVAL_SECONDS: Joi.number().integer().min(15).default(45),
  FEATURE_FLAGS_MAX_AGE_SECONDS: Joi.number().integer().min(5).default(30),

  // Security
  CORS_ORIGIN: Joi.alternatives().try(Joi.string(), Joi.boolean()).default('*'), // String can be comma-separated origins
  GLOBAL_PREFIX: Joi.string().optional().allow(''),

  // API Keys (example)
  API_KEY_SECRET_NAME: Joi.string().optional(),
});