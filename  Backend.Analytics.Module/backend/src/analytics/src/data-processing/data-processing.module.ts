import { Module } from '@nestjs/common';
// import { AnalyticsDataProcessor } from './services/analytics-data.processor';
// import { StorageModule } from '../storage/storage.module'; // If AnalyticsDataProcessor depends on AnalyticsRepository

/**
 * Encapsulates data processing and transformation logic,
 * converting raw ingested data into a structured format.
 */
@Module({
  imports: [
    // StorageModule, // Uncomment if AnalyticsDataProcessor uses AnalyticsRepository
  ],
  providers: [
    // AnalyticsDataProcessor,
  ],
  exports: [
    // AnalyticsDataProcessor,
  ],
})
export class DataProcessingModule {}