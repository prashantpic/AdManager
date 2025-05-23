import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// import { DataAggregatorService } from './services/data-aggregator.service';
// import { AggregationScheduler } from './jobs/aggregation.scheduler';
// import { StorageModule } from '../storage/storage.module'; // If DataAggregatorService depends on AnalyticsRepository
// import { ConfigModule } from '@nestjs/config'; // If services use config

/**
 * Handles the aggregation of processed analytics data into various time-based granularities.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    // StorageModule, // Uncomment if services use AnalyticsRepository
    // ConfigModule, // Uncomment if services use configuration
  ],
  providers: [
    // DataAggregatorService,
    // AggregationScheduler,
  ],
  exports: [
    // DataAggregatorService,
  ],
})
export class DataAggregationModule {}