import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.module';

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);

  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly docClient: DynamoDBDocumentClient,
  ) {}

  async getItem<T>(
    tableName: string,
    key: Record<string, any>,
  ): Promise<T | undefined> {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: key,
    };
    try {
      const result: GetCommandOutput = await this.docClient.send(
        new GetCommand(params),
      );
      return result.Item as T | undefined;
    } catch (error) {
      this.logger.error(
        `Error getting item from ${tableName} with key ${JSON.stringify(key)}`,
        error.stack,
      );
      throw error;
    }
  }

  async putItem<T>(
    tableName: string,
    item: T,
  ): Promise<PutCommandOutput> {
    const params: PutCommandInput = {
      TableName: tableName,
      Item: item as Record<string, any>,
    };
    try {
      return await this.docClient.send(new PutCommand(params));
    } catch (error) {
      this.logger.error(
        `Error putting item to ${tableName}: ${JSON.stringify(item)}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateItem(
    params: UpdateCommandInput,
  ): Promise<UpdateCommandOutput> {
    try {
      return await this.docClient.send(new UpdateCommand(params));
    } catch (error) {
      this.logger.error(
        `Error updating item in ${params.TableName} with key ${JSON.stringify(
          params.Key,
        )}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteItem(
    tableName: string,
    key: Record<string, any>,
  ): Promise<DeleteCommandOutput> {
    const params: DeleteCommandInput = {
      TableName: tableName,
      Key: key,
    };
    try {
      return await this.docClient.send(new DeleteCommand(params));
    } catch (error) {
      this.logger.error(
        `Error deleting item from ${tableName} with key ${JSON.stringify(key)}`,
        error.stack,
      );
      throw error;
    }
  }

  async query<T>(params: QueryCommandInput): Promise<T[]> {
    try {
      const result = await this.docClient.send(new QueryCommand(params));
      return (result.Items || []) as T[];
    } catch (error) {
      this.logger.error(
        `Error querying table ${params.TableName}`,
        error.stack,
      );
      throw error;
    }
  }

  async scan<T>(params: ScanCommandInput): Promise<T[]> {
    try {
      const result = await this.docClient.send(new ScanCommand(params));
      return (result.Items || []) as T[];
    } catch (error) {
      this.logger.error(`Error scanning table ${params.TableName}`, error.stack);
      throw error;
    }
  }
}