import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { CoreConfigModule } from './config/config.module';
import { SecretsModule } from './config/secrets/secrets.module';
import { CoreLoggingModule } from './logging/logging.module';
import { TracingModule } from './tracing/tracing.module';
import { DatabaseModule } from './database/database.module';
import { CoreCacheModule } from './cache/cache.module';
import { SqsModule } from './messaging/sqs/sqs.module';
import { S3Module } from './storage/s3/s3.module';
import { CoreHttpClientModule } from './http-client/http-client.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';

import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { GlobalHttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { TracingInterceptor } from './tracing/tracing.interceptor';

@Global()
@Module({
  imports: [
    CoreConfigModule,
    SecretsModule,
    CoreLoggingModule,
    TracingModule,
    DatabaseModule,
    CoreCacheModule,
    SqsModule,
    S3Module,
    CoreHttpClientModule,
    FeatureFlagsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: GlobalValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
  exports: [
    CoreConfigModule,
    SecretsModule,
    CoreLoggingModule,
    TracingModule,
    DatabaseModule,
    CoreCacheModule,
    SqsModule,
    S3Module,
    CoreHttpClientModule,
    FeatureFlagsModule,
  ],
})
export class CoreModule {}