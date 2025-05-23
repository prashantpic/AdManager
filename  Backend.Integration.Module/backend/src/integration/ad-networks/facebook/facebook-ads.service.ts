import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../../common/providers/http-client.service';
import { FacebookAdsMapper } from './facebook-ads.mapper';
import { FacebookAdsApiConfig } from './facebook-ads.config';
import { ExternalServiceId } from '../../common/enums/external-service.enum';
import {
  IntegrationException,
  // ExternalServiceAuthenticationException,
  // RateLimitExceededException,
  // ExternalServiceUnavailableException,
  // DataMappingException,
} from '../../common/exceptions';

@Injectable()
export class FacebookAdsService {
  private readonly logger = new Logger(FacebookAdsService.name);
  private readonly FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/vX.Y'; // Replace vX.Y with actual version

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly facebookAdsMapper: FacebookAdsMapper,
    private readonly facebookAdsApiConfig: FacebookAdsApiConfig,
  ) {
    // Replace X.Y in URL with actual config value if needed
    this.FACEBOOK_GRAPH_API_BASE_URL = `https://graph.facebook.com/${this.facebookAdsApiConfig.graphApiVersion || 'v18.0'}`;
  }

  async createCampaign(merchantId: string, campaignData: any): Promise<any> {
    // Typically uses Ad Account ID from config or merchant-specific settings
    const adAccountId = this.facebookAdsApiConfig.adAccountId; // This might need to be merchant-specific
    const path = `/${adAccountId}/campaigns`;

    // const mappedData = this.facebookAdsMapper.toFacebookCampaignCreateRequest(campaignData);
    try {
      this.logger.log(`Creating Facebook Ads campaign for merchant ${merchantId}`);
      // Authentication (OAuth2 access token) is handled by HttpClientService via ExternalTokenService.
      // HttpClientService will inject the `access_token` param or Authorization header.
      const response = await this.httpClientService.post(
        `${this.FACEBOOK_GRAPH_API_BASE_URL}${path}`,
        campaignData, // Send mappedData
        {}, // Config for HttpClientService if any, beyond auth
        ExternalServiceId.FACEBOOK_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleFacebookAdsError(error, 'createCampaign', merchantId);
    }
  }

  async updateProductCatalog(merchantId: string, catalogData: any): Promise<any> {
    // This would typically involve Facebook Catalog API and a catalog ID
    const catalogId = this.facebookAdsApiConfig.catalogId; // This might need to be merchant-specific
    const path = `/${catalogId}/batch`; // Example for product feed push

    // const mappedData = this.facebookAdsMapper.toFacebookProductCatalogUpdateRequest(catalogData);
    try {
      this.logger.log(`Updating Facebook product catalog for merchant ${merchantId}`);
      const response = await this.httpClientService.post(
        `${this.FACEBOOK_GRAPH_API_BASE_URL}${path}`,
        catalogData, // Send mappedData
        {},
        ExternalServiceId.FACEBOOK_ADS,
        merchantId,
      );
      return response.data; // Or map response
    } catch (error) {
      this.handleFacebookAdsError(error, 'updateProductCatalog', merchantId);
    }
  }

  async fetchPerformanceData(merchantId: string, campaignId: string, dateRange: any): Promise<any> {
    const path = `/${campaignId}/insights`;
    const params = {
      // fields: 'impressions,clicks,spend,cpc,ctr,roas_value', // Example fields
      fields: this.facebookAdsApiConfig.defaultInsightFields || 'impressions,clicks,spend',
      time_range: { since: dateRange.startDate, until: dateRange.endDate },
      // level: 'campaign', // or adset, ad
    };

    try {
      this.logger.log(`Fetching Facebook Ads performance data for campaign ${campaignId}, merchant ${merchantId}`);
      const response = await this.httpClientService.get(
        `${this.FACEBOOK_GRAPH_API_BASE_URL}${path}`,
        { params },
        ExternalServiceId.FACEBOOK_ADS,
        merchantId,
      );
      // const mappedData = this.facebookAdsMapper.toPlatformPerformanceData(response.data);
      // return mappedData;
      return response.data;
    } catch (error) {
      this.handleFacebookAdsError(error, 'fetchPerformanceData', merchantId);
    }
  }

  private handleFacebookAdsError(error: any, operation: string, merchantId?: string): never {
    this.logger.error(`Facebook Ads API error during ${operation} for merchant ${merchantId}: ${error.message}`, error.stack);
    if (error instanceof IntegrationException) {
      throw error;
    }
    // Map Facebook specific errors if necessary
    throw new IntegrationException(
      `Facebook Ads API error during ${operation}: ${error.message}`,
      ExternalServiceId.FACEBOOK_ADS.toString(),
      error.status,
      error,
    );
  }
}