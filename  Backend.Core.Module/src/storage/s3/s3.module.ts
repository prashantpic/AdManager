import { Module, Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { S3Service } from './s3.service';
import { IS3Service } from './s3.interface';
import { s3Config } from './s3.config';

export const S3_CLIENT_TOKEN = 'S3_CLIENT_TOKEN';

const s3ClientProvider: Provider = {
  provide: S3_CLIENT_TOKEN,
  useFactory: (configService: CoreConfigService) => {
    return new S3Client(s3Config(configService));
  },
  inject: [CoreConfigService],
};

@Module({
  imports: [CoreConfigModule],
  providers: [
    s3ClientProvider,
    {
      provide: IS3Service,
      useClass: S3Service,
    },
  ],
  exports: [IS3Service],
})
export class S3Module {}