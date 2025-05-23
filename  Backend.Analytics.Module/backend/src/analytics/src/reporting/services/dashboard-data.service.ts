import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AnalyticsRepository } from '../../storage/repositories/analytics.repository';
import { MetricCalculatorService } from '../../metrics/services/metric-calculator.service';
import { AttributionService } from './attribution.service';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';
import { AnalyticsConfig } from '../../config/analytics.config';
import { ConfigService } from '@nestjs/config';
import { DataGranularity } from '../../common/enums/data-granularity.enum';

/**
 * Service dedicated to fetching and preparing data for various merchant-facing and internal analytics dashboards.
 */
@Injectable()
export class DashboardDataService {
  private readonly logger = new Logger(DashboardDataService.name);
  private analyticsConfig: AnalyticsConfig;

  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly metricCalculatorService: MetricCalculatorService,
    private readonly attributionService: AttributionService,
    private readonly configService: ConfigService,
  ) {
    this.analyticsConfig = this.configService.get<AnalyticsConfig>('analytics');
  }

  /**
   * Data for sales trends dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getSalesTrendsDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching sales trends dashboard data for merchant ${merchantId}`,
    );
    // Example: Fetch daily sales, orders, AOV for the given date range
    const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['totalSales', 'orderCount', 'totalRevenue'], // Assuming these are stored metric names
      dimensionsFilter: query.filters,
    });

    // Transform data for charting (e.g., time series)
    // Apply MetricCalculatorService for derived metrics like AOV
    const dashboardData = aggregatedData.map(agg => ({
        period: agg.periodStart,
        sales: agg.metricName === 'totalSales' ? agg.metricValue : 0,
        orders: agg.metricName === 'orderCount' ? agg.metricValue : 0,
        // This needs proper grouping and calculation
        // aov: this.metricCalculatorService.calculateAOV(...)
    }));


    return {
      title: 'Sales Trends',
      query,
      data: dashboardData, // Placeholder - structure for charting library
      summary: {
        // Calculate overall summary from aggregatedData
      },
    };
  }

  /**
   * Data for customer behavior patterns dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getCustomerBehaviorDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching customer behavior dashboard data for merchant ${merchantId}`,
    );
    // Example: New vs. Returning Customers, Top Products Viewed/Purchased
     const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['newCustomers', 'returningCustomers', 'productViews', 'productPurchases'],
      dimensionsFilter: query.filters,
    });

    return {
      title: 'Customer Behavior Insights',
      query,
      data: aggregatedData, // Placeholder
    };
  }

  /**
   * Data for advertising performance metrics dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getAdPerformanceDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching ad performance dashboard data for merchant ${merchantId}`,
    );
    // Example: ROAS, CPA, CPC, CTR trends, top performing campaigns
    const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['spend', 'impressions', 'clicks', 'conversions'], // Base metrics
      dimensionsFilter: query.filters, // e.g., filter by campaignId
    });

    // Use MetricCalculatorService to derive ROAS, CPA, CPC, CTR
    // Apply AttributionService if conversions need attribution analysis for the dashboard

    return {
      title: 'Ad Performance Overview',
      query,
      data: aggregatedData, // Placeholder
    };
  }

  /**
   * Data for affiliate performance dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getAffiliatePerformanceDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching affiliate performance dashboard data for merchant ${merchantId}`,
    );
     const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['affiliateConversions', 'affiliateRevenue', 'affiliateClicks'],
      dimensionsFilter: query.filters, // e.g., filter by affiliateId
    });
    return {
      title: 'Affiliate Performance',
      query,
      data: aggregatedData, // Placeholder
    };
  }

  /**
   * Data for discount effectiveness dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getDiscountEffectivenessDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching discount effectiveness dashboard data for merchant ${merchantId}`,
    );
    const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['discountUsageCount', 'revenueWithDiscount', 'discountAmount'],
      dimensionsFilter: query.filters, // e.g., filter by discountCode
    });
    return {
      title: 'Discount Effectiveness',
      query,
      data: aggregatedData, // Placeholder
    };
  }

  /**
   * Data for promoted listing performance dashboard.
   * @param query - The dashboard query parameters.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the dashboard data.
   */
  async getPromotedListingDashboard(
    query: DashboardQueryDto,
    merchantId: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching promoted listing dashboard data for merchant ${merchantId}`,
    );
     const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      merchantId,
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.DAILY,
      metricNames: ['promotedListingImpressions', 'promotedListingClicks', 'promotedListingConversions'],
      dimensionsFilter: query.filters, // e.g., filter by productId
    });
    return {
      title: 'Promoted Listing Performance',
      query,
      data: aggregatedData, // Placeholder
    };
  }

  /**
   * Data for internal operational dashboards based on admin role.
   * @param query - The dashboard query parameters.
   * @param adminRole - The role of the admin user.
   * @returns A promise resolving to the dashboard data.
   */
  async getInternalOperationalMetricsDashboard(
    query: DashboardQueryDto,
    adminRole: string,
  ): Promise<any> {
    this.logger.log(
      `Fetching internal operational dashboard data for admin role: ${adminRole}`,
    );

    const allowedRoles = this.analyticsConfig.internal_operational_dashboard_roles || [];
    if (!allowedRoles.includes(adminRole)) {
      this.logger.warn(
        `Admin role ${adminRole} is not authorized to access internal operational dashboards.`,
      );
      throw new ForbiddenException('Access denied to this dashboard.');
    }

    // Example: Platform-wide event counts, processing latencies, error rates
    // This would query data potentially without merchantId scoping, or aggregated across merchants
    const aggregatedData = await this.analyticsRepository.findAggregatedMetrics({
      // merchantId: undefined, // For platform-wide metrics
      dateRange: query.dateRange,
      granularity: query.granularity || DataGranularity.HOURLY,
      metricNames: ['totalEventsProcessed', 'avgProcessingLatency', 'errorRate'],
      dimensionsFilter: query.filters,
    });

    // Consider dashboard_data_freshness_minutes from config
    const dataFreshnessMinutes = this.analyticsConfig.dashboard_data_freshness_minutes || 5;
    this.logger.log(`Target data freshness: ${dataFreshnessMinutes} minutes.`);
    // This information might be used to determine if a cache is valid or if more recent data polling is needed.

    return {
      title: 'Internal Operational Metrics',
      query,
      data: aggregatedData, // Placeholder
    };
  }
}