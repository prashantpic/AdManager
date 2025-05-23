```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreConfigService } from './config.service';
// TODO: Define environmentValidationSchema in src/config/validation-schema.ts and import it.
// For now, using a placeholder. It should be a Joi or Zod schema.
// import * as Joi from 'joi';
// const environmentValidationSchema = Joi.object({
//   NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
//   PORT: Joi.number().default(3000),
//   AWS_REGION: Joi.string().required(),
//   // Add other expected environment variables here
// });

const environmentValidationSchema = {}; // Placeholder

/**
 * @module CoreConfigModule
 * @description NestJS module for application configuration management.
 * Uses `@nestjs/config` to load environment variables and provides a `CoreConfigService`
 * for typed access to configuration values.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally without importing CoreConfigModule
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In prod, expect env vars to be set directly
      validationSchema: environmentValidationSchema as any, // Cast to any due to placeholder
      validationOptions: {
        allowUnknown: true, // Allow unknown env variables (they won't be loaded into ConfigService)
        abortEarly: false, // Validate all env variables, not just the first error
      },
      // TODO: Implement loading from AWS Systems Manager Parameter Store if REQ-16-020 specifies and feature flag is enabled.
      // This might require `forRootAsync` and a custom config loader.
      // load: [() => ({})] // Example if using load functions
    }),
  ],
  providers: [CoreConfigService],
  exports: [CoreConfigService],
})
export class CoreConfigModule {}
```