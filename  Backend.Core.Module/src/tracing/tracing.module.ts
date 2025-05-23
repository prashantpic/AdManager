import { Module, OnModuleInit } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk-core';
import * as express from 'express';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { TracingInterceptor } from './tracing.interceptor';
import { TracingService } from './tracing.service';

@Module({
  imports: [CoreConfigModule],
  providers: [TracingService, TracingInterceptor],
  exports: [TracingService, TracingInterceptor],
})
export class TracingModule implements OnModuleInit {
  constructor(private readonly configService: CoreConfigService) {}

  onModuleInit() {
    // Configure AWS X-Ray
    // AWSXRay.setLogger(console); // Use your structured logger
    // AWSXRay.setDaemonAddress('127.0.0.1:2000'); // Or use environment variables

    if (this.configService.get('NODE_ENV') === 'development') {
        AWSXRay.setContextMissingStrategy('LOG_ERROR');
    } else {
        AWSXRay.setContextMissingStrategy(() => { /* silent */ });
    }

    // Capture outgoing HTTP requests (if not using patched AWS SDK for everything)
    AWSXRay.captureHTTPsGlobal(require('http'));
    AWSXRay.captureHTTPsGlobal(require('https'));
    
    // Capture Promises
    AWSXRay.capturePromise();

    // Patch AWS SDK if enabled
    const enableXRayFull = this.configService.getFeatureFlag('enableXRayTracingFull'); // Assuming IAppConfig has this
    if (enableXRayFull) {
      AWSXRay.captureAWS(require('aws-sdk')); // For SDK v2
      // For AWS SDK v3, it's typically done by instrumenting individual clients or using OpenTelemetry
      // This basic setup might need extension for comprehensive v3 client tracing if not using OpenTelemetry.
      // However, manual subsegment creation in services (like S3Service, SQSService) will still work.
      // AWSXRay.captureAWSv3Client(new S3Client({})); // Example, but usually done via middleware if available.
    }

    // Express middleware for incoming requests (NestJS uses Express by default)
    // This is typically done at the app level in main.ts or via an interceptor.
    // The TracingInterceptor will handle NestJS specific request/response lifecycle.
    // app.use(AWSXRay.express.openSegment('AdManagerBackend')); // Example for main.ts
    // app.use(AWSXRay.express.closeSegment());
  }
}