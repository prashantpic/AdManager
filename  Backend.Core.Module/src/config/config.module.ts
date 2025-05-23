```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestJsConfigModule, ConfigFactory } from '@nestjs/config';
import { CoreConfigService } from './config.service';
import { environmentValidationSchema } from './validation-schema';
import { IAppConfig } from './config.interface';
// import { loadFromParameterStore } from './parameter-store.loader'; // Placeholder for potential SSM loader

/**
 * @description Loads basic environment configurations.
 * For `forRootAsync`, `process.env` (populated by `envFilePath`) is the base.
 * This loader can be used to add defaults or transform values before validation if needed,
 * or to integrate other synchronous config sources.
 * For truly async sources like Parameter Store, a separate async loader function would be added to the `load` array.
 */
const appConfigLoader: ConfigFactory<Partial<IAppConfig>> = () => {
  // Example: If we needed to provide default values or parse specific env vars before Joi validation
  // const port = parseInt(process.env.PORT, 10);
  // return {
  //   PORT: isNaN(port) ? 3000 : port, // Joi will validate this later
  //   NODE_ENV: process.env.NODE_ENV || 'development',
  // };
  // For most cases where .env files are primary and Joi handles parsing/defaults,
  // this loader can be minimal or even an empty object if `process.env` is sufficient.
  return {};
};

/**
 * @class CoreConfigModule
 * @description NestJS module for application configuration management.
 * Uses `@nestjs/config.ConfigModule.forRootAsync` to load environment variables,
 * validate them using `environmentValidationSchema`, and provides `CoreConfigService` for typed access.
 * REQ-16-020
 */
@Global() // Makes CoreConfigService globally available after this module is imported in AppModule
@Module({
  imports: [
    NestJsConfigModule.forRootAsync({
      isGlobal: true, // Makes the underlying NestJS ConfigService globally available
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [
        appConfigLoader,
        // async () => { // Example for an async loader like Parameter Store
        //   if (process.env.USE_PARAMETER_STORE === 'true') {
        //     return await loadFromParameterStore({
        //        region: process.env.AWS_REGION,
        //        parameters: { /* paths to parameters */ }
        //     });
        //   }
        //   return {};
        // },
      ],
      validationSchema: environmentValidationSchema, // Joi schema for validation
      validationOptions: {
        allowUnknown: false, // As per SDS: Disallow properties not in schema
        abortEarly: true,    // As per SDS: Stop validation on first error
      },
      cache: true, // Enable caching of configuration variables
      expandVariables: true, // Enable variable expansion (e.g., VAR=${OTHER_VAR})
    }),
  ],
  providers: [CoreConfigService],
  exports: [CoreConfigService],
})
export class CoreConfigModule {}
```