import { Campaign } from '../../entities/campaign.entity';
import { AdSet } from '../../entities/ad-set.entity';
import { Ad } from '../../entities/ad.entity';
import { AdNetworkType } from '../../../constants/ad-network-type.enum';
import { CampaignStatus } from '../../../constants/campaign-status.enum';

export interface AdNetworkPublishResult {
  adNetworkType: AdNetworkType;
  externalCampaignId: string;
  externalAdSetIds?: { [internalAdSetId: string]: string };
  externalAdIds?: { [internalAdId: string]: string };
}

export interface AdNetworkPreviewResult {
  previewUrl?: string;
  previewHtml?: string; // Or other preview formats
  error?: string;
}

export interface IAdNetworkIntegrationService {
  publishCampaign(
    campaign: Campaign, // Full campaign aggregate might be needed
    adSets: AdSet[],
    ads: Ad[]
  ): Promise<AdNetworkPublishResult>;

  updateCampaignStatusOnNetwork(
    externalCampaignId: string,
    adNetworkType: AdNetworkType,
    status: CampaignStatus, // This should map to network-specific status
  ): Promise<void>;

  getCampaignStatusFromNetwork(
    externalCampaignId: string,
    adNetworkType: AdNetworkType,
  ): Promise<CampaignStatus>; // This maps network-specific status to our enum

  getAdPreview(
    ad: Ad, // Or specific ad data
    adSet: AdSet, // For context
    campaign: Campaign, // For context
    adNetworkType: AdNetworkType,
  ): Promise<AdNetworkPreviewResult>;

  // Method for fetching detailed status for an already published campaign
  syncCampaignDetailedStatus(
    campaign: Campaign, // Contains external references
  ): Promise<{ status: CampaignStatus; networkReferences?: any; lastSyncedAt: Date }>;
}

export const IAdNetworkIntegrationService = Symbol('IAdNetworkIntegrationService');