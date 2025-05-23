import { Module } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { DynamoDBService } from './dynamodb.service';
import { dynamoDBConfigFactory } from './dynamodb.config'; // Assuming this factory exists

export const DYNAMODB_DOCUMENT_CLIENT = 'DYNAMODB_DOCUMENT_CLIENT';

@Module({
  imports: [CoreConfigModule],
  providers: [
    {
      provide: DYNAMODB_DOCUMENT_CLIENT,
      useFactory: (coreConfigService: CoreConfigService) => {
        const clientConfig = dynamoDBConfigFactory(coreConfigService);
        const client = new DynamoDBClient(clientConfig.client);
        return DynamoDBDocumentClient.from(client, clientConfig.documentClient);
      },
      inject: [CoreConfigService],
    },
    DynamoDBService,
  ],
  exports: [DynamoDBService],
})
export class CoreDynamoDBModule {}