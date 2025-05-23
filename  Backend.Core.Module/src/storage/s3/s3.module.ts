import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';
import { IS3Service } from './s3.interface'; // Assuming this interface exists
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { s3ConfigFactory } from './s3.config'; // Assuming this factory exists

export const S3_CLIENT = 'S3_CLIENT';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: (configService: CoreConfigService): S3Client => {
        const clientOptions = s3ConfigFactory(configService);
        return new S3Client(clientOptions);
      },
      inject: [CoreConfigService],
    },
    {
      provide: IS3Service, // Use an injection token for the interface
      useClass: S3Service,
    },
  ],
  exports: [IS3Service], // Export the interface token
})
export class S3Module {}