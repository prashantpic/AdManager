import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';
import { HttpClientService } from './http-client.service';
import { IHttpClientService } from './http-client.interface'; // Assuming this interface exists
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';

@Module({
  imports: [
    CoreConfigModule,
    HttpModule.registerAsync({
      imports: [CoreConfigModule],
      useFactory: async (configService: CoreConfigService) => ({
        timeout: configService.getHttpClientDefaultTimeoutMs(),
        maxRedirects: 5,
        httpsAgent: new https.Agent({
          // Enforce TLS 1.2+ by default. Node.js 12.11.0+ defaults to TLS 1.2/1.3 min.
          // Explicitly set minVersion if supporting older Node or for absolute certainty.
          // secureProtocol: 'TLSv1_2_method', // More direct but can be restrictive
          minVersion: 'TLSv1.2',
          rejectUnauthorized: configService.getNodeEnv() === 'production', // Enforce cert validation in prod
        }),
      }),
      inject: [CoreConfigService],
    }),
  ],
  providers: [
    {
      provide: IHttpClientService, // Use an injection token for the interface
      useClass: HttpClientService,
    },
  ],
  exports: [IHttpClientService], // Export the interface token
})
export class CoreHttpClientModule {}