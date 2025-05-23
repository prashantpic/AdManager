import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AggregatedMetricEntity } from './entities/aggregated-metric.entity';
// import { ProcessedEventEntity } from './entities/processed-event.entity';
// import { ReportConfigurationEntity } from './entities/report-configuration.entity';
// import { AnalyticsRepository } from './repositories/analytics.repository';
// import { ReportConfigurationRepository } from './repositories/report-configuration.repository';

/**
 * Manages data persistence for analytics, including entities and repositories
 * for interacting with the PostgreSQL database.
 */
@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   AggregatedMetricEntity,
    //   ProcessedEventEntity,
    //   ReportConfigurationEntity,
    // ]),
  ],
  providers: [
    // AnalyticsRepository,
    // ReportConfigurationRepository,
  ],
  exports: [
    // AnalyticsRepository,
    // ReportConfigurationRepository,
    // TypeOrmModule, // Export if other modules directly use these entities via TypeOrmModule.forFeature
  ],
})
export class StorageModule {}