import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { HttpClientService } from './http-client.service';
import { IHttpClientService } from './http-client.interface';
import * as https from 'https';

@Module({
  imports: [
    CoreConfigModule,
    HttpModule.registerAsync({
      imports: [CoreConfigModule],
      useFactory: (configService: CoreConfigService) => ({
        timeout: configService.getHttpClientDefaultTimeoutMs(),
        maxRedirects: 5,
        httpsAgent: new https.Agent({ 
          // Ensures TLS 1.2+ by default in modern Node.js versions.
          // For older Node versions, specific cipher suites or minVersion might be needed.
          // SecureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1, // Example for explicit control
          secureProtocol: 'TLSv1_2_method', // More explicit for older Node.js
        }),
      }),
      inject: [CoreConfigService],
    }),
  ],
  providers: [
    {
      provide: IHttpClientService,
      useClass: HttpClientService,
    },
  ],
  exports: [IHttpClientService],
})
export class CoreHttpClientModule {}