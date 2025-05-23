import { Module } from '@nestjs/common';
import { CoreConfigModule } from './config/config.module';
import { SecretsModule } from './config/secrets/secrets.module';
import { CoreLoggingModule } from './logging/logging.module';
import { TracingModule } from './tracing/tracing.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { CoreCacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { SqsModule } from './messaging/sqs/sqs.module';
import { S3Module } from './storage/s3/s3.module';
import { CoreHttpClientModule } from './http-client/http-client.module';

/**
 * @Module CoreModule
 * @description
 * Root module for the Core package, importing and exporting all core functionalities.
 * This module aggregates all shared infrastructure and cross-cutting concern modules,
 * making them available for dependency injection across the application when CoreModule
 * is imported into the main AppModule or other feature modules.
 *
 * As per the design specification (SDS 5.14, 5.15), global pipes, filters, and interceptors
 * (like GlobalValidationPipe, GlobalHttpExceptionFilter, TracingInterceptor) are
 * instantiated and applied directly in `main.ts` to ensure true global scope and
 * allow for direct injection of application-level dependencies if needed (e.g., `app.get(Dependency)`).
 * Therefore, this CoreModule focuses on importing and re-exporting the functional modules.
 */
@Module({
  imports: [
    CoreConfigModule,
    SecretsModule,
    CoreLoggingModule,
    TracingModule,
    FeatureFlagsModule,
    CoreCacheModule,
    DatabaseModule,
    SqsModule,
    S3Module,
    CoreHttpClientModule,
  ],
  exports: [
    CoreConfigModule,
    SecretsModule,
    CoreLoggingModule,
    TracingModule,
    FeatureFlagsModule,
    CoreCacheModule,
    DatabaseModule,
    SqsModule,
    S3Module,
    CoreHttpClientModule,
  ],
})
export class CoreModule {}