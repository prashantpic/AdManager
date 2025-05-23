import { CreateCampaignGoogleRequestDto } from '../dtos/request/create-campaign.google.request.dto';
import { SyncCatalogGoogleRequestDto } from '../dtos/request/sync-catalog.google.request.dto';
import { CampaignStatusGoogleResponseDto } from '../dtos/response/campaign-status.google.response.dto';

/**
 * Interface defining the contract for Google Ads client (service) operations.
 * This enables dependency inversion and enhances testability for services interacting
 * with the Google Ads API.
 */
export interface IGoogleAdsClient {
  /**
   * Creates a new campaign in Google Ads.
   * @param merchantId - The ID of the merchant for whom the campaign is being created.
   * @param campaignData - The DTO containing data for the new campaign.
   * @returns A promise that resolves with the response from Google Ads API (e.g., created campaign details).
   */
  createCampaign(
    merchantId: string,
    campaignData: CreateCampaignGoogleRequestDto,
  ): Promise<any>;

  /**
   * Updates or synchronizes a product catalog with Google Merchant Center or Ads API.
   * @param merchantId - The ID of the merchant whose catalog is being updated.
   * @param catalogData - The DTO containing the catalog data to sync.
   * @returns A promise that resolves with the response from Google Ads API (e.g., sync status).
   */
  updateProductCatalog(
    merchantId: string,
    catalogData: SyncCatalogGoogleRequestDto,
  ): Promise<any>;

  /**
   * Retrieves the status of a specific campaign from Google Ads.
   * @param merchantId - The ID of the merchant who owns the campaign.
   * @param campaignId - The ID of the campaign whose status is to be fetched.
   * @returns A promise that resolves with the campaign status DTO.
   */
  getCampaignStatus(
    merchantId: string,
    campaignId: string,
  ): Promise<CampaignStatusGoogleResponseDto>;

  /**
   * Fetches performance data for a specific campaign from Google Ads.
   * @param merchantId - The ID of the merchant who owns the campaign.
   * @param campaignId - The ID of the campaign for which performance data is requested.
   * @param dateRange - An object specifying the date range for the performance data.
   * @returns A promise that resolves with the performance data (structure may vary).
   */
  fetchPerformanceData(
    merchantId: string,
    campaignId: string,
    dateRange: any, // Consider defining a specific DTO for dateRange
  ): Promise<any>;
}

export const IGoogleAdsClient = Symbol('IGoogleAdsClient');