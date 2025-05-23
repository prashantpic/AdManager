import { Module } from '@nestjs/common';
// import { DataIngestionService } from './services/data-ingestion.service';
// import { AnalyticsEventSqsConsumer } from './consumers/analytics-event.sqs.consumer';
// import { DataProcessingModule } from '../data-processing/data-processing.module'; // If DataIngestionService depends on AnalyticsDataProcessor directly

/**
 * Manages the ingestion phase of the analytics pipeline,
 * including consumers for SQS queues and initial data handling services.
 */
@Module({
  imports: [
    // DataProcessingModule, // Uncomment if DataIngestionService calls AnalyticsDataProcessor
  ],
  providers: [
    // DataIngestionService,
    // AnalyticsEventSqsConsumer,
  ],
  exports: [
    // DataIngestionService,
  ],
})
export class DataIngestionModule {}