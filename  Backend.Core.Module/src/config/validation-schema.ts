import * as Joi from 'joi';

/**
 * @file Validation schema for environment variables using Joi.
 * @namespace AdManager.Platform.Backend.Core.Config
 * @requirement REQ-16-020
 */

export const environmentValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_GLOBAL_PREFIX: Joi.string().optional().allow(''),

  // AWS
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_SESSION_TOKEN: Joi.string().optional(),


  // Database (PostgreSQL - TypeORM)
  DB_TYPE: Joi.string().valid('postgres').default('postgres'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_PASSWORD_SECRET_NAME: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.string() // Comma-separated list e.g. "query,error"
    .optional()
    .default('')
    .custom((value: string, helpers) => {
      if (!value) return [];
      const validLevels = ['query', 'error', 'schema', 'warn', 'info', 'log', 'migration'];
      const levels = value.split(',').map(level => level.trim());
      for (const level of levels) {
        if (!validLevels.includes(level)) {
          return helpers.error('any.invalid', { value, message: `Invalid DB_LOGGING level: ${level}` });
        }
      }
      return levels;
    }),
  DB_SSL_ENABLED: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().optional(),
  DB_SSL_CA_SECRET_NAME: Joi.string().when('DB_SSL_ENABLED', {
    is: true,
    then: Joi.string().optional(), // Optional if SSL enabled, might use system CAs
    otherwise: Joi.forbidden(),
  }),

  // Database (DynamoDB)
  DYNAMODB_ENABLE_LOCAL: Joi.boolean().default(false),
  DYNAMODB_LOCAL_ENDPOINT: Joi.string().when('DYNAMODB_ENABLE_LOCAL', {
    is: true,
    then: Joi.string().uri().required(),
    otherwise: Joi.optional(),
  }),

  // Cache (Redis)
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD_SECRET_NAME: Joi.string().optional(),
  REDIS_TLS_ENABLED: Joi.boolean().default(false),
  DEFAULT_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(3600), // 1 hour
  SECRETS_CACHE_TTL_SECONDS: Joi.number().integer().min(0).default(300), // 5 minutes

  // Logging (Pino)
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_REDACTION_PATHS: Joi.string() // Comma-separated list
    .optional()
    .default('req.headers.authorization,req.headers.cookie,body.password,body.token,body.accessToken,body.refreshToken')
    .custom((value: string) => value.split(',').map(p => p.trim())),


  // Tracing (AWS X-Ray)
  XRAY_DAEMON_ADDRESS: Joi.string().default('127.0.0.1:2000'),
  XRAY_CONTEXT_MISSING_STRATEGY: Joi.string()
    .valid('LOG_ERROR', 'RUNTIME_ERROR')
    .default('LOG_ERROR'),
  ENABLE_XRAY_TRACING: Joi.boolean().default(false),
  ENABLE_XRAY_TRACING_FULL: Joi.boolean().default(false),

  // S3
  S3_DEFAULT_BUCKET: Joi.string().required(),
  S3_ASSETS_BUCKET_NAME: Joi.string().required(),
  S3_LOGS_BUCKET_NAME: Joi.string().required(),
  S3_BACKUPS_BUCKET_NAME: Joi.string().required(),
  S3_DEFAULT_SSE_ALGORITHM: Joi.string()
    .valid('AES256', 'aws:kms')
    .default('AES256'),
  S3_KMS_KEY_ID: Joi.string().when('S3_DEFAULT_SSE_ALGORITHM', {
    is: 'aws:kms',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  // HTTP Client
  HTTP_CLIENT_DEFAULT_TIMEOUT_MS: Joi.number().integer().min(0).default(5000),

  // Feature Flags
  APPCONFIG_APPLICATION_ID: Joi.string().optional(),
  APPCONFIG_ENVIRONMENT_ID: Joi.string().optional(),
  APPCONFIG_PROFILE_ID: Joi.string().optional(),
  FEATURE_FLAG_ENABLE_ADVANCED_LOGGING_DETAILS: Joi.boolean().default(false),
  FEATURE_FLAG_USE_PARAMETER_STORE_FOR_NON_SENSITIVE_CONFIG: Joi.boolean().default(false),
  FEATURE_FLAG_ENABLE_DYNAMODB_LOCAL_ENDPOINT: Joi.boolean().default(false), // Duplicate of DYNAMODB_ENABLE_LOCAL, consider merging
  FEATURE_FLAG_ENABLE_REDIS_CACHE_DETAILED_LOGGING: Joi.boolean().default(false),

  // Security
  CORS_ORIGIN: Joi.alternatives()
    .try(
        Joi.string().custom((value: string, helpers) => {
            if (value === '*') return '*';
            try {
                const origins = value.split(',').map(o => o.trim());
                origins.forEach(o => new URL(o)); // validate if URL
                return origins;
            } catch (e) {
                return helpers.error('string.uriCustom', { message: 'Invalid URL in CORS_ORIGIN list' });
            }
        }),
        Joi.boolean()
    )
    .default(true), // Default to true to allow all origins, or specify a sensible default like specific domains
  HELMET_CONFIG: Joi.object().optional(),
});