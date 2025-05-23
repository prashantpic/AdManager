import { Module } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SqsProducerService } from './sqs.producer.service';
import { ISqsProducerService } from './sqs.interface'; // Assuming this interface exists
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { sqsConfigFactory } from './sqs.config'; // Assuming this factory exists

export const SQS_CLIENT = 'SQS_CLIENT';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: SQS_CLIENT,
      useFactory: (configService: CoreConfigService): SQSClient => {
        const clientOptions = sqsConfigFactory(configService);
        return new SQSClient(clientOptions);
      },
      inject: [CoreConfigService],
    },
    {
      provide: ISqsProducerService, // Use an injection token for the interface
      useClass: SqsProducerService,
    },
  ],
  exports: [ISqsProducerService], // Export the interface token
})
export class SqsModule {}