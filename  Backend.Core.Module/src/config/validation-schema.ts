import * as Joi from 'joi';
import { NodeEnvironment, IAppConfig } from './config.interface';

/**
 * @file Validation schema for environment variables using Joi.
 * This schema is used by @nestjs/config to validate the environment during application bootstrap.
 * @Requirement REQ-16-020
 */

export const environmentValidationSchema = Joi.object<IAppConfig, true>({
  // Application
  NODE_ENV: Joi.string()
    .valid(...Object.values(NodeEnvironment))
    .default(NodeEnvironment.Development),
  PORT: Joi.number().integer().min(1024).max(65535).default(3000),
  API_PREFIX: Joi.string().optional().allow(''),

  // AWS
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_SESSION_TOKEN: Joi.string().optional(),

  // Database (PostgreSQL - TypeORM)
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().integer().min(1).max(65535).required(),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL_ENABLED: Joi.boolean().default(true), // Default to true for production-like RDS
  DATABASE_LOGGING_ENABLED: Joi.boolean().default(false),

  // Database (DynamoDB)
  DYNAMODB_TABLE_PREFIX: Joi.string().optional().allow(''),
  DYNAMODB_ENDPOINT_URL: Joi.string().uri().optional(),
  ENABLE_DYNAMODB_LOCAL_ENDPOINT: Joi.boolean().default(false),

  // Cache (Redis - ioredis)
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).required(),
  REDIS_TLS_ENABLED: Joi.boolean().default(true), // Default to true for ElastiCache
  DEFAULT_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(3600), // 1 hour
  ENABLE_REDIS_CACHE_DETAILED_LOGGING: Joi.boolean().default(false),

  // Secrets Management
  SECRETS_MANAGER_DB_CREDENTIALS_NAME: Joi.string().required(),
  SECRETS_MANAGER_REDIS_PASSWORD_NAME: Joi.string().optional(),
  SECRETS_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(300), // 5 minutes

  // Logging (Pino)
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_REDACTION_PATHS: Joi.array().items(Joi.string()).default([]),
  ENABLE_ADVANCED_LOGGING_DETAILS: Joi.boolean().default(false),

  // Tracing (AWS X-Ray)
  ENABLE_XRAY_TRACING: Joi.boolean().default(false),
  ENABLE_XRAY_TRACING_FULL: Joi.boolean().default(false),

  // Messaging (SQS)
  SQS_EXAMPLE_QUEUE_URL: Joi.string().uri().required(), // Example, adjust as needed
  SQS_ENDPOINT_URL: Joi.string().uri().optional(),

  // Storage (S3)
  S3_ASSETS_BUCKET_NAME: Joi.string().required(),
  S3_LOGS_BUCKET_NAME: Joi.string().required(),
  S3_BACKUPS_BUCKET_NAME: Joi.string().required(),
  S3_DEFAULT_SSE_ALGORITHM: Joi.string().valid('AES256', 'aws:kms').default('AES256'),
  S3_KMS_KEY_ID: Joi.string().when('S3_DEFAULT_SSE_ALGORITHM', {
    is: 'aws:kms',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  S3_ENDPOINT_URL: Joi.string().uri().optional(),

  // HTTP Client (Axios)
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: Joi.number().integer().min(0).default(5000), // 5 seconds

  // Feature Flags (e.g., AWS AppConfig)
  FEATURE_FLAG_APPCONFIG_APP_ID: Joi.string().optional(),
  FEATURE_FLAG_APPCONFIG_ENV_ID: Joi.string().optional(),
  FEATURE_FLAG_APPCONFIG_PROFILE_ID: Joi.string().optional(),
  FEATURE_FLAG_POLL_INTERVAL_SECONDS: Joi.number().integer().min(15).optional(), // Min 15s for AppConfig

  // Parameter Store
  USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG: Joi.boolean().default(false),
  PARAMETER_STORE_PATH_PREFIX: Joi.string().when('USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG', {
    is: true,
    then: Joi.string().pattern(/^\/.+\/$/).required(), // e.g. /app/env/
    otherwise: Joi.optional(),
  }),

  // Security
  CORS_ORIGIN: Joi.alternatives()
    .try(Joi.string().uri(), Joi.array().items(Joi.string().uri()), Joi.string().valid('*'))
    .optional(),
  HELMET_ENABLED: Joi.boolean().default(true),
});