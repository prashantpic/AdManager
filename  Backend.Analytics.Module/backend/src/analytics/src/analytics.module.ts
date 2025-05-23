import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import analyticsConfig from './config/analytics.config';
import { DataIngestionModule } from './data-ingestion/data-ingestion.module';
import { DataProcessingModule } from './data-processing/data-processing.module';
import { DataAggregationModule } from './data-aggregation/data-aggregation.module';
import { ReportingModule } from './reporting/reporting.module';
import { MetricsModule } from './metrics/metrics.module';
import { StorageModule } from './storage/storage.module';
import { DataRetentionModule } from './data-retention/data-retention.module';

/**
 * Entry point and orchestrator for the backend analytics module,
 * managing the entire lifecycle of analytics data.
 * Its primary function is to initialize and orchestrate all analytics-related functionalities
 * including data ingestion, processing, aggregation, metrics calculation, reporting, and data retention.
 */
@Module({
  imports: [
    ConfigModule.forFeature(analyticsConfig),
    DataIngestionModule,
    DataProcessingModule,
    DataAggregationModule,
    ReportingModule,
    MetricsModule,
    StorageModule, // Analytics-specific storage module
    DataRetentionModule,
  ],
  controllers: [], // Controllers are expected within sub-modules, e.g., ReportingModule
  providers: [],   // Providers are expected within sub-modules
  exports: [],     // This module aggregates other modules; direct exports are usually from sub-modules.
})
export class AnalyticsModule {}