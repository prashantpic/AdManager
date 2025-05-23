import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { TikTokAdsMapper } from './tiktok-ads.mapper';
import { TikTokAdsApiConfig } from './tiktok-ads.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException } from '../../common/exceptions';

@Injectable()
export class TikTokAdsService {
  private readonly logger = new Logger(TikTokAdsService.name);
  private readonly TIKTOK_ADS_API_BASE_URL = 'https://business-api.tiktok.com/open_api/v1.3'; // Check latest version

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly tikTokAdsMapper: TikTokAdsMapper,
    private readonly tikTokAdsApiConfig: TikTokAdsApiConfig,
  ) {}

  async createCampaign(merchantId: string, campaignData: any): Promise<any> {
    const path = `/campaign/create/`;
    // TikTok API requires advertiser_id in many calls
    const advertiserId = this.tikTokAdsApiConfig.advertiserId; // This might be merchant-specific

    // const mappedData = this.tikTokAdsMapper.toTikTokCampaignCreateRequest(campaignData, advertiserId);
    try {
      this.logger.log(`Creating TikTok Ads campaign for merchant ${merchantId}`);
      // TikTok API authentication uses an Access Token in the header.
      // HttpClientService will handle this via ExternalTokenService.
      const response = await this.httpClientService.post(
        `${this.TIKTOK_ADS_API_BASE_URL}${path}`,
        { ...campaignData, advertiser_id: advertiserId }, // Send mappedData
        {}, // Additional config for HttpClientService
        ExternalServiceId.TIKTOK_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleTikTokAdsError(error, 'createCampaign', merchantId);
    }
  }

  async updateProductCatalog(merchantId: string, catalogData: any): Promise<any> {
    // TikTok catalog management might have specific endpoints, e.g., /catalog/product/upload/
    const path = `/catalog/product/upload/`; // Example path
    const advertiserId = this.tikTokAdsApiConfig.advertiserId;

    // const mappedData = this.tikTokAdsMapper.toTikTokProductCatalogUpdateRequest(catalogData, advertiserId);
    try {
      this.logger.log(`Updating TikTok product catalog for merchant ${merchantId}`);
      const response = await this.httpClientService.post(
        `${this.TIKTOK_ADS_API_BASE_URL}${path}`,
        { ...catalogData, advertiser_id: advertiserId }, // Send mappedData
        {},
        ExternalServiceId.TIKTOK_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleTikTokAdsError(error, 'updateProductCatalog', merchantId);
    }
  }

  async fetchPerformanceData(merchantId: string, campaignId: string, dateRange: any): Promise<any> {
    const path = `/report/integrated/get/`; // Example reporting endpoint
    const advertiserId = this.tikTokAdsApiConfig.advertiserId;
    const reportParams = {
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      dimensions: ['campaign_id', 'stat_time_day'],
      metrics: ['impressions', 'clicks', 'spend', 'cpc', 'ctr'], // Example metrics
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      filtering: [{ field_name: 'campaign_id', filter_type: 'IN', filter_value: [campaignId] }],
    };

    try {
      this.logger.log(`Fetching TikTok Ads performance data for campaign ${campaignId}, merchant ${merchantId}`);
      const response = await this.httpClientService.get(
        `${this.TIKTOK_ADS_API_BASE_URL}${path}`,
        { params: reportParams },
        ExternalServiceId.TIKTOK_ADS,
        merchantId,
      );
      // const mappedData = this.tikTokAdsMapper.toPlatformPerformanceData(response.data);
      // return mappedData;
      return response.data;
    } catch (error) {
      this.handleTikTokAdsError(error, 'fetchPerformanceData', merchantId);
    }
  }

  private handleTikTokAdsError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`TikTok Ads API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // Map TikTok specific errors if necessary
    throw new IntegrationException(
      `TikTok Ads API error during ${operation}: ${error.message}`,
      ExternalServiceId.TIKTOK_ADS.toString(),
      error.status,
      error,
    );
  }
}