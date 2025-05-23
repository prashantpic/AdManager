import { Module, Provider } from '@nestjs/common';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { DynamoDBService } from './dynamodb.service';
import { dynamoDBConfig } from './dynamodb.config';

export const DYNAMODB_DOCUMENT_CLIENT = 'DYNAMODB_DOCUMENT_CLIENT';

const dynamoDBDocumentClientProvider: Provider = {
  provide: DYNAMODB_DOCUMENT_CLIENT,
  useFactory: (configService: CoreConfigService) => {
    const client = new DynamoDBClient(dynamoDBConfig(configService));
    return DynamoDBDocumentClient.from(client);
  },
  inject: [CoreConfigService],
};

@Module({
  imports: [CoreConfigModule],
  providers: [dynamoDBDocumentClientProvider, DynamoDBService],
  exports: [DynamoDBService],
})
export class CoreDynamoDBModule {}