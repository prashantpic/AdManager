import { Inject, Injectable, Logger } from '@nestjs/common';
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
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.module';

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);

  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly docClient: DynamoDBDocumentClient,
  ) {}

  async getItem<T = Record<string, any>>(
    params: GetCommandInput,
  ): Promise<T | undefined> {
    try {
      const command = new GetCommand(params);
      const result: GetCommandOutput = await this.docClient.send(command);
      return result.Item as T | undefined;
    } catch (error) {
      this.logger.error(`Error getting item from ${params.TableName}:`, error);
      throw error;
    }
  }

  async putItem<T = Record<string, any>>(
    params: PutCommandInput,
  ): Promise<PutCommandOutput> {
    try {
      const command = new PutCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.logger.error(`Error putting item to ${params.TableName}:`, error);
      throw error;
    }
  }

  async updateItem(
    params: UpdateCommandInput,
  ): Promise<UpdateCommandOutput> {
    try {
      const command = new UpdateCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.logger.error(`Error updating item in ${params.TableName}:`, error);
      throw error;
    }
  }

  async deleteItem(
    params: DeleteCommandInput,
  ): Promise<DeleteCommandOutput> {
    try {
      const command = new DeleteCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.logger.error(`Error deleting item from ${params.TableName}:`, error);
      throw error;
    }
  }

  async query<T = Record<string, any>>(
    params: QueryCommandInput,
  ): Promise<T[]> {
    try {
      const command = new QueryCommand(params);
      const result: QueryCommandOutput = await this.docClient.send(command);
      return (result.Items || []) as T[];
    } catch (error) {
      this.logger.error(`Error querying table ${params.TableName}:`, error);
      throw error;
    }
  }

  async scan<T = Record<string, any>>(params: ScanCommandInput): Promise<T[]> {
    try {
      const command = new ScanCommand(params);
      const result: ScanCommandOutput = await this.docClient.send(command);
      return (result.Items || []) as T[];
    } catch (error) {
      this.logger.error(`Error scanning table ${params.TableName}:`, error);
      throw error;
    }
  }
}