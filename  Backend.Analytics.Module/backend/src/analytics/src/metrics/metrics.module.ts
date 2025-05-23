import { Module } from '@nestjs/common';
// import { MetricCalculatorService } from './services/metric-calculator.service';

/**
 * Handles the calculation of key analytics metrics (KPIs)
 * used in reports and dashboards.
 */
@Module({
  providers: [
    // MetricCalculatorService,
  ],
  exports: [
    // MetricCalculatorService,
  ],
})
export class MetricsModule {}