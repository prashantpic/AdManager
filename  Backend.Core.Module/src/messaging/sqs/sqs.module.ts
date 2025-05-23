import { Module, Provider } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { SqsProducerService } from './sqs.producer.service';
import { ISqsProducerService } from './sqs.interface';
import { sqsConfig } from './sqs.config';

export const SQS_CLIENT_TOKEN = 'SQS_CLIENT_TOKEN';

const sqsClientProvider: Provider = {
  provide: SQS_CLIENT_TOKEN,
  useFactory: (configService: CoreConfigService) => {
    return new SQSClient(sqsConfig(configService));
  },
  inject: [CoreConfigService],
};

@Module({
  imports: [CoreConfigModule],
  providers: [
    sqsClientProvider,
    {
      provide: ISqsProducerService,
      useClass: SqsProducerService,
    },
  ],
  exports: [ISqsProducerService],
})
export class SqsModule {}