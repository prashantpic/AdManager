import { Module } from '@nestjs/common';
// import { DashboardsController } from './controllers/dashboards.controller';
// import { ReportsController } from './controllers/reports.controller';
// import { AttributionService } from './services/attribution.service';
// import { DashboardDataService } from './services/dashboard-data.service';
// import { ReportGenerationService } from './services/report-generation.service';
// import { StorageModule } from '../storage/storage.module'; // For repositories
// import { MetricsModule } from '../metrics/metrics.module'; // For MetricCalculatorService
// import { ConfigModule } from '@nestjs/config'; // For analyticsConfig

/**
 * Manages all aspects of analytics reporting, including customizable reports,
 * dashboard data provision, and attribution modeling.
 */
@Module({
  imports: [
    // StorageModule,
    // MetricsModule,
    // ConfigModule,
  ],
  controllers: [
    // DashboardsController,
    // ReportsController,
  ],
  providers: [
    // AttributionService,
    // DashboardDataService,
    // ReportGenerationService,
  ],
  exports: [
    // DashboardDataService,
    // ReportGenerationService,
  ],
})
export class ReportingModule {}