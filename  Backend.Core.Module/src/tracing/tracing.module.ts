import { Module, OnModuleInit, DynamicModule } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk-core';
import { TracingInterceptor } from './tracing.interceptor';
import { TracingService } from './tracing.service';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { IncomingMessage } from 'http';

@Module({
  imports: [CoreConfigModule],
  providers: [TracingService, TracingInterceptor],
  exports: [TracingService, TracingInterceptor],
})
export class TracingModule implements OnModuleInit {
  constructor(private readonly configService: CoreConfigService) {}

  onModuleInit() {
    const nodeEnv = this.configService.getNodeEnv();
    const serviceName =
      this.configService.get('APP_NAME') || 'AdManagerPlatform';

    AWSXRay.setLogger(console); // Use your structured logger ideally
    AWSXRay.setDaemonAddress(
      this.configService.get('AWS_XRAY_DAEMON_ADDRESS') || '127.0.0.1:2000',
    );
    AWSXRay.setContextMissingStrategy('LOG_ERROR'); // Or 'IGNORE'

    if (nodeEnv === 'development' || nodeEnv === 'test') {
      AWSXRay.setStreamingThreshold(1); // Send segments immediately in dev/test
    }
    
    // Configure the X-Ray SDK for Express manually if not using aws-xray-sdk-express middleware
    // AWSXRay.middleware.setSegmentNamingStrategy((req: IncomingMessage) => {
    //   // Custom naming strategy if needed
    //   return serviceName;
    // });

    // Capture all AWS SDK V3 clients
    AWSXRay.captureAWSv3Client(new AWSXRay.AWS({region: this.configService.getAwsRegion()}));


    if (this.configService.getFeatureFlag('enableXRayTracingFull')) {
        AWSXRay.captureHTTPsGlobal(require('http'));
        AWSXRay.captureHTTPsGlobal(require('https'));
        AWSXRay.capturePromise();
    }
    
    console.log('AWS X-Ray SDK Initialized.');
  }

  static forRoot(): DynamicModule {
    // Optional: if you need to pass dynamic config to the module
    return {
      module: TracingModule,
      imports: [CoreConfigModule],
      providers: [TracingService, TracingInterceptor],
      exports: [TracingService, TracingInterceptor],
    };
  }
}