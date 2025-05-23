import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAnalyticsDataPoint } from '../../common/interfaces/analytics-data-point.interface';
import { AnalyticsDataProcessor } from '../../data-processing/services/analytics-data.processor';
// Import AWS SDK clients if raw data storage to Timestream/DynamoDB is implemented
// import { TimestreamWriteClient, WriteRecordsCommand } from "@aws-sdk/client-timestream-write";
// import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

/**
 * Handles the initial stages of data ingestion, including validation
 * and optional raw data storage before further processing.
 */
@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);
  private readonly enableTimestreamForRawData: boolean;
  private readonly enableDynamoDBForRawDataHotPath: boolean;
  // private timestreamClient: TimestreamWriteClient; // Placeholder
  // private dynamoDbClient: DynamoDBDocumentClient; // Placeholder

  constructor(
    private readonly configService: ConfigService,
    private readonly analyticsDataProcessor: AnalyticsDataProcessor,
  ) {
    this.enableTimestreamForRawData = this.configService.get<boolean>('featureFlags.enableTimestreamForRawData', false);
    this.enableDynamoDBForRawDataHotPath = this.configService.get<boolean>('featureFlags.enableDynamoDBForRawDataHotPath', false);

    if (this.enableTimestreamForRawData) {
      // this.timestreamClient = new TimestreamWriteClient({ region: configService.get('AWS_REGION') });
      this.logger.log('Timestream for raw data is ENABLED.');
    }
    if (this.enableDynamoDBForRawDataHotPath) {
      // this.dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: configService.get('AWS_REGION') }));
      this.logger.log('DynamoDB for raw data hot path is ENABLED.');
    }
  }

  /**
   * Processes a validated raw event, possibly stores it in a hot/raw store,
   * and triggers further processing.
   * @param eventData The raw analytics data point.
   */
  async handleIncomingEvent(eventData: IAnalyticsDataPoint): Promise<void> {
    this.logger.log(`Handling incoming event for merchant ${eventData.merchantId}, type ${eventData.eventType}`);

    // Basic validation (already partially done in consumer, but good to have here too)
    if (!eventData.merchantId || !eventData.eventTimestamp || !eventData.eventType || !eventData.payload) {
      this.logger.error('Invalid event data received in DataIngestionService', eventData);
      // Potentially throw an error or return early
      return;
    }

    // Optional: Store raw event in Timestream
    if (this.enableTimestreamForRawData) {
      try {
        // Placeholder for Timestream raw data storage logic
        this.logger.debug(`Storing raw event in Timestream (merchant: ${eventData.merchantId}, type: ${eventData.eventType})`);
        // const params = { ... };
        // await this.timestreamClient.send(new WriteRecordsCommand(params));
      } catch (error) {
        this.logger.error(`Failed to store raw event in Timestream: ${error.message}`, error.stack);
        // Decide on error handling: continue processing or fail?
      }
    }

    // Optional: Store raw event in DynamoDB (hot path)
    if (this.enableDynamoDBForRawDataHotPath) {
      try {
        // Placeholder for DynamoDB raw data storage logic
        this.logger.debug(`Storing raw event in DynamoDB (merchant: ${eventData.merchantId}, type: ${eventData.eventType})`);
        // const params = { TableName: 'RawAnalyticsEventsHotPath', Item: { ...eventData, ttl: ... } };
        // await this.dynamoDbClient.send(new PutCommand(params));
      } catch (error) {
        this.logger.error(`Failed to store raw event in DynamoDB: ${error.message}`, error.stack);
        // Decide on error handling
      }
    }

    // Forward to AnalyticsDataProcessor for transformation and structured persistence
    try {
      const processedEvent = await this.analyticsDataProcessor.processEvent(eventData);
      if (processedEvent) {
        this.logger.log(`Event processed successfully by AnalyticsDataProcessor (merchant: ${eventData.merchantId}, type: ${eventData.eventType})`);
      } else {
        this.logger.warn(`Event (merchant: ${eventData.merchantId}, type: ${eventData.eventType}) was not processed or resulted in null by AnalyticsDataProcessor.`);
      }
    } catch (error) {
      this.logger.error(
        `Error during event processing by AnalyticsDataProcessor (merchant: ${eventData.merchantId}, type: ${eventData.eventType}): ${error.message}`,
        error.stack,
      );
      // Handle processing error, e.g., send to a dead letter processing queue or log for retry
    }
  }
}