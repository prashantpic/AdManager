import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// import { DataRetentionService } from './services/data-retention.service';
// import { DataCleanupScheduler } from './jobs/data-cleanup.scheduler';
// import { StorageModule } from '../storage/storage.module'; // For AnalyticsRepository
// import { ConfigModule } from '@nestjs/config'; // For analyticsConfig

/**
 * Manages the application of data retention policies,
 * including services and schedulers for data cleanup.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    // StorageModule,
    // ConfigModule,
  ],
  providers: [
    // DataRetentionService,
    // DataCleanupScheduler,
  ],
})
export class DataRetentionModule {}