import { registerAs } from '@nestjs/config';
import { AttributionModel } from '../common/enums/attribution-model.enum';

export interface AnalyticsConfig {
  raw_data_retention_months: number;
  aggregated_data_retention_years: number;
  default_attribution_model: AttributionModel;
  sqs_ingestion_queue_url: string;
  dashboard_data_freshness_minutes: number;
  internal_operational_dashboard_roles: string[];
}

export default registerAs(
  'analyticsConfig',
  (): AnalyticsConfig => ({
    raw_data_retention_months: parseInt(
      process.env.ANALYTICS_RAW_DATA_RETENTION_MONTHS,
      10,
    ) || 6,
    aggregated_data_retention_years: parseInt(
      process.env.ANALYTICS_AGGREGATED_DATA_RETENTION_YEARS,
      10,
    ) || 5,
    default_attribution_model:
      (process.env.ANALYTICS_DEFAULT_ATTRIBUTION_MODEL as AttributionModel) ||
      AttributionModel.LAST_CLICK,
    sqs_ingestion_queue_url:
      process.env.ANALYTICS_SQS_INGESTION_QUEUE_URL ||
      'http://localhost:4566/000000000000/analytics-ingestion-queue', // Default for localstack
    dashboard_data_freshness_minutes: parseInt(
        process.env.ANALYTICS_DASHBOARD_DATA_FRESHNESS_MINUTES,
        10,
    ) || 5,
    internal_operational_dashboard_roles: process.env.ANALYTICS_INTERNAL_OPERATIONAL_DASHBOARD_ROLES
      ? process.env.ANALYTICS_INTERNAL_OPERATIONAL_DASHBOARD_ROLES.split(',')
      : ['PlatformAdmin', 'AnalyticsManager'],
  }),
);