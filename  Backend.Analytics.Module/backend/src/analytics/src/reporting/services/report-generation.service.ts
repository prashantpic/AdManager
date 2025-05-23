import { Injectable, Logger, NotFoundException, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportRequestDto } from '../dtos/report-request.dto';
import { ReportResponseDto } from '../dtos/report-response.dto';
import { ReportConfigurationDto } from '../dtos/report-configuration.dto';
import { IPredefinedReportTemplate } from '../templates/predefined-report.interface';
import { AttributionService } from './attribution.service';
import { MetricCalculatorService } from '../../metrics/services/metric-calculator.service';
import { AnalyticsRepository } from '../../storage/repositories/analytics.repository';
import { ReportConfigurationRepository } from '../../storage/repositories/report-configuration.repository';
import { ReportConfigurationEntity } from '../../storage/entities/report-configuration.entity';
import { ReportExportFormat } from '../../common/enums/report-export-format.enum';
import { DateRangeDto } from '../../common/dtos/date-range.dto';
import { DataGranularity } from '../../common/enums/data-granularity.enum';
// Placeholder for actual export libraries
// import { createObjectCsvWriter } from 'csv-writer';
// import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

/**
 * Core service for generating customizable analytics reports, managing saved configurations, and providing template information.
 */
@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    @InjectRepository(ReportConfigurationEntity)
    private readonly reportConfigurationRepository: ReportConfigurationRepository,
    private readonly attributionService: AttributionService,
    private readonly metricCalculatorService: MetricCalculatorService,
  ) {}

  /**
   * Generates a report based on the request, returning JSON data or a Buffer for file export.
   * @param reportRequest - The parameters for the report.
   * @param merchantId - The ID of the merchant requesting the report.
   * @returns A promise resolving to the report response or a buffer for file export.
   */
  async generateReport(
    reportRequest: ReportRequestDto,
    merchantId: string,
  ): Promise<ReportResponseDto | Buffer> {
    this.logger.log(
      `Generating report for merchant ${merchantId} with type: ${reportRequest.reportType}`,
    );

    try {
      let rawData: any[] = [];
      // Determine data source: aggregated or processed
      // This is a simplified decision logic. Real-world might be more complex.
      const isRecentData = this.isDateRangeRecent(reportRequest.dateRange, 7); // e.g., last 7 days
      const needsRawDetail = reportRequest.metrics.includes('raw_event_count'); // Example metric needing raw data

      if (
        reportRequest.exportFormat !== ReportExportFormat.JSON &&
        (isRecentData || needsRawDetail)
      ) {
        // For exports, prefer aggregated data unless very specific raw data is needed
        // This logic needs to be refined based on specific report types and performance considerations
        this.logger.log(
          `Fetching processed events for report: ${reportRequest.reportType}`,
        );
        const processedEvents =
          await this.analyticsRepository.findProcessedEvents({
            merchantId,
            dateRange: reportRequest.dateRange,
            eventTypes: reportRequest.filters?.eventTypes as string[], // Example filter
            dimensionsFilter: reportRequest.filters?.dimensions,
          });
        rawData = processedEvents; // Needs further transformation
      } else {
        this.logger.log(
          `Fetching aggregated metrics for report: ${reportRequest.reportType}`,
        );
        rawData = await this.analyticsRepository.findAggregatedMetrics({
          merchantId,
          dateRange: reportRequest.dateRange,
          granularity:
            reportRequest.filters?.granularity || DataGranularity.DAILY,
          metricNames: reportRequest.metrics,
          dimensionsFilter: reportRequest.filters?.dimensions,
        });
      }

      // Apply attribution if model is specified and relevant
      if (reportRequest.attributionModel && rawData.length > 0) {
        // Placeholder: Attribution logic would typically apply to conversion-related events
        // This example assumes rawData contains events that can be used as touchpoints
        // For aggregated data, attribution is usually pre-calculated or applied differently
        this.logger.log(
          `Applying attribution model: ${reportRequest.attributionModel}`,
        );
        // rawData = await this.attributionService.applyAttributionToReportData(rawData, reportRequest.attributionModel);
      }

      // Calculate metrics using MetricCalculatorService (if needed for derived metrics)
      // Placeholder: rawData might need transformation and metric calculation
      // Example: if rawData contains base numbers, and DTO requests ROAS
      // const calculatedMetricsData = this.metricCalculatorService.calculateMetricsForReport(rawData, reportRequest.metrics);

      const reportData = rawData; // Placeholder, actual transformation needed
      const reportSummary = { totalRecords: reportData.length }; // Placeholder

      if (reportRequest.exportFormat === ReportExportFormat.CSV) {
        this.logger.log('Generating CSV export');
        return this.generateCsvBuffer(reportData);
      } else if (reportRequest.exportFormat === ReportExportFormat.XLSX) {
        this.logger.log('Generating XLSX export');
        return this.generateXlsxBuffer(reportData);
      }

      const response: ReportResponseDto = {
        reportName: reportRequest.reportType, // Or a more descriptive name
        generatedAt: new Date(),
        requestParameters: reportRequest,
        data: reportData,
        summary: reportSummary,
      };
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate report for merchant ${merchantId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not generate report.');
    }
  }

  /**
   * Retrieves all saved report configurations for a merchant.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to an array of report configurations.
   */
  async getSavedReportConfigurations(
    merchantId: string,
  ): Promise<ReportConfigurationDto[]> {
    this.logger.log(
      `Fetching saved report configurations for merchant ${merchantId}`,
    );
    const entities =
      await this.reportConfigurationRepository.findByMerchantId(merchantId);
    return entities.map(this.mapEntityToDto);
  }

  /**
   * Retrieves a specific saved report configuration.
   * @param configId - The ID of the configuration.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the report configuration or null if not found.
   */
  async getReportConfigurationById(
    configId: string,
    merchantId: string,
  ): Promise<ReportConfigurationDto | null> {
    this.logger.log(
      `Fetching report configuration ${configId} for merchant ${merchantId}`,
    );
    const entity =
      await this.reportConfigurationRepository.findByIdAndMerchantId(
        configId,
        merchantId,
      );
    if (!entity) {
      this.logger.warn(
        `Report configuration ${configId} not found for merchant ${merchantId}`,
      );
      return null;
    }
    return this.mapEntityToDto(entity);
  }

  /**
   * Saves or updates a report configuration.
   * @param configDto - The report configuration DTO.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the saved report configuration.
   */
  async saveReportConfiguration(
    configDto: ReportConfigurationDto,
    merchantId: string,
  ): Promise<ReportConfigurationDto> {
    this.logger.log(
      `Saving report configuration for merchant ${merchantId}: ${configDto.name}`,
    );
    if (configDto.id && configDto.merchantId !== merchantId) {
        throw new NotFoundException('Report configuration not found or access denied.');
    }

    const entity = new ReportConfigurationEntity();
    if (configDto.id) {
      const existing = await this.reportConfigurationRepository.findByIdAndMerchantId(configDto.id, merchantId);
      if (!existing) {
        throw new NotFoundException(`Report configuration with ID "${configDto.id}" not found for merchant "${merchantId}".`);
      }
      Object.assign(entity, existing); // Preserve existing fields like createdAt
    }

    entity.merchantId = merchantId;
    entity.name = configDto.name;
    entity.description = configDto.description;
    entity.configurationJson = configDto.configurationDetails; // Stored as JSONB

    const savedEntity =
      await this.reportConfigurationRepository.saveConfiguration(entity);
    return this.mapEntityToDto(savedEntity);
  }

  /**
   * Deletes a saved report configuration.
   * @param configId - The ID of the configuration to delete.
   * @param merchantId - The ID of the merchant.
   * @returns A promise that resolves when deletion is complete.
   */
  async deleteReportConfiguration(
    configId: string,
    merchantId: string,
  ): Promise<void> {
    this.logger.log(
      `Deleting report configuration ${configId} for merchant ${merchantId}`,
    );
    const result =
      await this.reportConfigurationRepository.deleteByIdAndMerchantId(
        configId,
        merchantId,
      );
    if (!result) {
      throw new NotFoundException(
        `Report configuration ${configId} not found or already deleted for merchant ${merchantId}.`,
      );
    }
  }

  /**
   * Returns a list of available predefined report templates.
   * @returns A promise resolving to an array of predefined report templates.
   */
  async getPredefinedReportTemplates(): Promise<IPredefinedReportTemplate[]> {
    this.logger.log('Fetching predefined report templates');
    // In a real application, these might come from a configuration file or database
    return Promise.resolve([
      {
        templateId: 'sales_overview_monthly',
        name: 'Monthly Sales Overview',
        description: 'A summary of key sales metrics for the last month.',
        category: 'Sales',
        defaultParameters: {
          reportType: 'SalesPerformance',
          metrics: ['totalSales', 'averageOrderValue', 'numberOfOrders'],
          // dateRange: { preset: 'LAST_MONTH' } // Example of a preset
          exportFormat: ReportExportFormat.JSON,
        },
      },
      {
        templateId: 'ad_roas_summary',
        name: 'Ad Campaign ROAS Summary',
        description:
          'Return on Ad Spend (ROAS) for active advertising campaigns.',
        category: 'Advertising',
        defaultParameters: {
          reportType: 'AdCampaignROAS',
          metrics: ['ROAS', 'totalSpend', 'totalRevenueFromAds'],
          dimensions: ['campaignName'],
          exportFormat: ReportExportFormat.JSON,
        },
      },
    ]);
  }

  private mapEntityToDto(
    entity: ReportConfigurationEntity,
  ): ReportConfigurationDto {
    return {
      id: entity.id,
      merchantId: entity.merchantId,
      name: entity.name,
      description: entity.description,
      configurationDetails: entity.configurationJson as ReportRequestDto, // Cast from JSONB
    };
  }

  private isDateRangeRecent(dateRange: DateRangeDto, days: number): boolean {
    const today = new Date();
    const recentDateThreshold = new Date();
    recentDateThreshold.setDate(today.getDate() - days);
    return new Date(dateRange.startDate) >= recentDateThreshold;
  }

  private async generateCsvBuffer(data: any[]): Promise<Buffer> {
    if (!data || data.length === 0) {
      return Buffer.from('');
    }
    // Simplified CSV generation. Use a robust library like 'csv-writer' in production.
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row)
        .map(value => (typeof value === 'string' && value.includes(',') ? `"${value}"` : value))
        .join(','),
    );
    const csvString = `${headers}\n${rows.join('\n')}`;
    return Buffer.from(csvString, 'utf-8');
  }

  private async generateXlsxBuffer(data: any[]): Promise<Buffer> {
    if (!data || data.length === 0) {
      return Buffer.from('');
    }
    // Placeholder for ExcelJS or similar library
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('Report');
    // if (data.length > 0) {
    //   worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key, width: 20 }));
    //   worksheet.addRows(data);
    // }
    // const buffer = await workbook.xlsx.writeBuffer();
    // return Buffer.from(buffer);
    this.logger.warn(
      'XLSX export is a placeholder. Implement with a suitable library.',
    );
    return Buffer.from('XLSX data placeholder', 'utf-8'); // Placeholder
  }
}