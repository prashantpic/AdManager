import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { SnapchatAdsMapper } from './snapchat-ads.mapper';
import { SnapchatAdsApiConfig } from './snapchat-ads.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import { IntegrationException } from '../../common/exceptions';

@Injectable()
export class SnapchatAdsService {
  private readonly logger = new Logger(SnapchatAdsService.name);
  private readonly SNAPCHAT_MARKETING_API_BASE_URL = 'https://adsapi.snapchat.com/v1';

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly snapchatAdsMapper: SnapchatAdsMapper,
    private readonly snapchatAdsApiConfig: SnapchatAdsApiConfig,
  ) {}

  async createCampaign(merchantId: string, campaignData: any): Promise<any> {
    const adAccountId = this.snapchatAdsApiConfig.adAccountId; // This might be merchant-specific
    const path = `/adaccounts/${adAccountId}/campaigns`;

    // const mappedData = this.snapchatAdsMapper.toSnapchatCampaignCreateRequest(campaignData);
    try {
      this.logger.log(`Creating Snapchat Ads campaign for merchant ${merchantId}`);
      // Snapchat API authentication uses an OAuth2 Bearer Token.
      // HttpClientService will handle this via ExternalTokenService.
      const response = await this.httpClientService.post(
        `${this.SNAPCHAT_MARKETING_API_BASE_URL}${path}`,
        { campaigns: [campaignData] }, // Snapchat often expects arrays, send mappedData
        {}, // Additional config for HttpClientService
        ExternalServiceId.SNAPCHAT_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleSnapchatAdsError(error, 'createCampaign', merchantId);
    }
  }

  async updateProductCatalog(merchantId: string, catalogData: any): Promise<any> {
    // Snapchat uses Catalogs and Product Feeds
    const catalogId = this.snapchatAdsApiConfig.catalogId; // This might be merchant-specific
    const path = `/catalogs/${catalogId}/products`; // Example, actual endpoint may vary

    // const mappedData = this.snapchatAdsMapper.toSnapchatProductCatalogUpdateRequest(catalogData);
    try {
      this.logger.log(`Updating Snapchat product catalog for merchant ${merchantId}`);
      const response = await this.httpClientService.post( // Or PUT/PATCH
        `${this.SNAPCHAT_MARKETING_API_BASE_URL}${path}`,
        { products: [catalogData] }, // Example payload
        {},
        ExternalServiceId.SNAPCHAT_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleSnapchatAdsError(error, 'updateProductCatalog', merchantId);
    }
  }

  async fetchPerformanceData(merchantId: string, campaignId: string, dateRange: any): Promise<any> {
    const path = `/campaigns/${campaignId}/stats`;
    const params = {
      start_time: dateRange.startDateISO, // Snapchat expects ISO 8601
      end_time: dateRange.endDateISO,
      granularity: 'DAY', // or TOTAL, HOUR
      // fields: 'impressions,swipes,spend', // Example fields
    };

    try {
      this.logger.log(`Fetching Snapchat Ads performance data for campaign ${campaignId}, merchant ${merchantId}`);
      const response = await this.httpClientService.get(
        `${this.SNAPCHAT_MARKETING_API_BASE_URL}${path}`,
        { params },
        ExternalServiceId.SNAPCHAT_ADS,
        merchantId,
      );
      // const mappedData = this.snapchatAdsMapper.toPlatformPerformanceData(response.data);
      // return mappedData;
      return response.data;
    } catch (error) {
      this.handleSnapchatAdsError(error, 'fetchPerformanceData', merchantId);
    }
  }

  private handleSnapchatAdsError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`Snapchat Ads API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    throw new IntegrationException(
      `Snapchat Ads API error during ${operation}: ${error.message}`,
      ExternalServiceId.SNAPCHAT_ADS.toString(),
      error.status,
      error,
    );
  }
}