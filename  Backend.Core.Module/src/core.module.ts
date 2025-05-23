import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { CoreConfigModule } from './config/config.module';
import { CoreConfigService } from './config/config.service';
import { SecretsModule } from './config/secrets/secrets.module';
import { SecretsService } from './config/secrets/secrets.service';
import { ISecretsService } from './config/secrets/secrets.interface';

import { CoreLoggingModule } from './logging/logging.module';
import { LoggingService } from './logging/logging.service';

import { TracingModule } from './tracing/tracing.module';
import { TracingInterceptor } from './tracing/tracing.interceptor';
import { TracingService } from './tracing/tracing.service';

import { DatabaseModule } from './database/database.module';
import { DynamoDBService } from './database/dynamodb/dynamodb.service';
// BaseRepository and BaseDynamoRepository are abstract, typically not directly injected as providers but extended.

import { CoreCacheModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';
import { ICacheService } from './cache/cache.interface';

import { SqsModule } from './messaging/sqs/sqs.module';
import { SqsProducerService } from './messaging/sqs/sqs.producer.service';
import { ISqsProducerService } from './messaging/sqs/sqs.interface';

import { S3Module } from './storage/s3/s3.module';
import { S3Service } from './storage/s3/s3.service';
import { IS3Service } from './storage/s3/s3.interface';

import { CoreHttpClientModule } from './http-client/http-client.module';
import { HttpClientService } from './http-client/http-client.service';
import { IHttpClientService } from './http-client/http-client.interface';

import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { FeatureFlagsService } from './feature-flags/feature-flags.service';
import { IFeatureFlagsService } from './feature-flags/feature-flags.interface';

import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { GlobalHttpExceptionFilter } from './common/exceptions/http-exception.filter';

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
    // Core Services for direct injection convenience
    CoreConfigService,
    { provide: ISecretsService, useClass: SecretsService },
    LoggingService, // NestJS LoggerService is usually injected via token or its concrete class
    TracingService,
    DynamoDBService,
    { provide: ICacheService, useClass: CacheService },
    { provide: ISqsProducerService, useClass: SqsProducerService },
    { provide: IS3Service, useClass: S3Service },
    { provide: IHttpClientService, useClass: HttpClientService },
    { provide: IFeatureFlagsService, useClass: FeatureFlagsService },

    // Global Pipe, Filter, Interceptor
    // These are registered globally in main.ts as per SDS 5.15,
    // but can also be provided here if modules importing CoreModule
    // want to re-use them or if an application is structured differently.
    // For this exercise, including them as per prompt.
    // If main.ts also registers them via app.useGlobal*, it's effectively done once.
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
    // Modules
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

    // Core Services for direct injection convenience
    CoreConfigService,
    ISecretsService, // Exporting the interface token
    LoggingService,
    TracingService,
    DynamoDBService,
    ICacheService, // Exporting the interface token
    ISqsProducerService, // Exporting the interface token
    IS3Service, // Exporting the interface token
    IHttpClientService, // Exporting the interface token
    IFeatureFlagsService, // Exporting the interface token
  ],
})
export class CoreModule {}