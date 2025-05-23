import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Campaign } from '../../domain/entities/campaign.entity';
import { Ad } from '../../domain/entities/ad.entity';
import { CampaignStatus } from '../../constants/campaign-status.enum';
import { AdNetworkType } from '../../constants/ad-network-type.enum';
import { CampaignSyncLog } from '../../domain/entities/campaign-sync-log.entity';

import { ICampaignRepository } from '../../domain/interfaces/repositories/campaign.repository.interface';
import { IAdRepository } from '../../domain/interfaces/repositories/ad.repository.interface';
import { ICampaignSyncLogRepository } from '../../domain/interfaces/repositories/campaign-sync-log.repository.interface';

import { CampaignPublisherService } from '../../domain/domain-services/campaign-publisher.service';
import { CampaignAssetLinkerService } from '../../domain/domain-services/campaign-asset-linker.service';

import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';
import { IEntitlementValidationService } from '../../domain/interfaces/services/entitlement-validation.interface';
import { IAdNetworkIntegrationService } from '../../domain/interfaces/services/ad-network-integration.interface';

import { CampaignSyncLogDto } from '../dtos/sync/campaign-sync-log.dto';
import { CampaignSyncLogMapper } from '../mappers/campaign-sync-log.mapper';

import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignPublishException } from '../../exceptions/campaign-publish.exception';
import { CampaignLimitException } from '../../exceptions/campaign-limit.exception';

@Injectable()
export class CampaignOrchestrationService {
  constructor(
    @Inject(ICampaignRepository) private readonly campaignRepository: ICampaignRepository,
    @Inject(IAdRepository) private readonly adRepository: IAdRepository,
    @Inject(ICampaignSyncLogRepository) private readonly campaignSyncLogRepository: ICampaignSyncLogRepository,
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
    @Inject(IEntitlementValidationService) private readonly entitlementService: IEntitlementValidationService,
    @Inject(IAdNetworkIntegrationService) private readonly adNetworkIntegrationService: IAdNetworkIntegrationService,
    private readonly campaignPublisher: CampaignPublisherService,
    private readonly campaignAssetLinker: CampaignAssetLinkerService,
    private readonly campaignSyncLogMapper: CampaignSyncLogMapper,
  ) {}

  async publishCampaign(campaignId: string, adNetworkType: AdNetworkType): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.REJECTED && campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException(`Campaign in status ${campaign.status} cannot be published.`);
    }

    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, `PUBLISH_TO_${adNetworkType}`)) {
      throw new CampaignLimitException(`Publishing to ${adNetworkType} is not available for your plan.`);
    }
    // Check for overall active campaign limits if applicable
    const activeCampaignsCount = await this.campaignRepository.countByStatus(merchantId, CampaignStatus.ACTIVE); // Assuming repository method
    if (!await this.entitlementService.checkUsageLimit(merchantId, 'MAX_ACTIVE_CAMPAIGNS', activeCampaignsCount)) {
        throw new CampaignLimitException('Maximum number of active campaigns reached.');
    }

    try {
      await this.campaignPublisher.publishCampaign(campaign, adNetworkType, merchantId);
      // The campaignPublisher service should update the campaign status internally.
      // Example: campaign.status = CampaignStatus.PENDING_REVIEW or ACTIVE based on network response
      // await this.campaignRepository.save(campaign); // publisher service should handle this
    } catch (error) {
      // campaign.status = CampaignStatus.ERROR;
      // await this.campaignRepository.save(campaign);
      // Log detailed error, CampaignPublisherService should also log
      throw new CampaignPublishException(adNetworkType, `Failed to publish campaign ${campaignId}: ${error.message}`, error);
    }
  }

  async updateCampaignStatus(campaignId: string, newStatus: CampaignStatus): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    // Add validation for valid status transitions
    // e.g., cannot move from COMPLETED to DRAFT, etc.
    // This logic should ideally be in a domain validator or the entity itself.
    if (campaign.status === newStatus) return;


    if (newStatus === CampaignStatus.ACTIVE) {
        if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'RESUME_CAMPAIGN')) {
             throw new CampaignLimitException('Resuming campaigns is not available for your plan.');
        }
         const activeCampaignsCount = await this.campaignRepository.countByStatus(merchantId, CampaignStatus.ACTIVE);
         if (!await this.entitlementService.checkUsageLimit(merchantId, 'MAX_ACTIVE_CAMPAIGNS', activeCampaignsCount)) {
             throw new CampaignLimitException('Maximum number of active campaigns reached.');
         }
    }
    
    // If updating status on an external ad network is needed
    if (campaign.externalReferences && campaign.externalReferences.length > 0) {
        for (const ref of campaign.externalReferences) {
            try {
                await this.campaignPublisher.updateCampaignStatusOnAdNetwork(campaign, ref.adNetworkType, newStatus, ref.externalId);
            } catch (error) {
                 // Log partial failure, decide on overall status update
                console.error(`Failed to update status for campaign ${campaignId} on ${ref.adNetworkType}: ${error.message}`);
                // Potentially set campaign status to ERROR or a specific sync error status
                // For now, we'll proceed with internal status update and log sync failure later
            }
        }
    }
    
    campaign.status = newStatus; // campaign.changeStatus(newStatus);
    await this.campaignRepository.save(campaign);
    // Dispatch CampaignStatusChangedEvent
  }


  async linkAssetsToAd(adId: string, assetType: 'PRODUCT' | 'PROMOTION', assetIds: string[]): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    // Entitlement check for using product/promotion linking
    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'LINK_AD_ASSETS')) {
      throw new CampaignLimitException('Linking assets to ads is not available for your plan.');
    }

    if (assetType === 'PRODUCT') {
      await this.campaignAssetLinker.linkProductsToAd(ad, assetIds, merchantId);
    } else if (assetType === 'PROMOTION') {
      await this.campaignAssetLinker.linkPromotionsToAd(ad, assetIds, merchantId);
    } else {
      throw new BadRequestException('Invalid asset type provided.');
    }
    await this.adRepository.save(ad); // Save changes made by the linker
  }

  async fetchCampaignSyncLogs(campaignId: string): Promise<CampaignSyncLogDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    // First, verify campaign ownership
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    const logs = await this.campaignSyncLogRepository.findByCampaignId(campaignId, merchantId);
    return logs.map(log => this.campaignSyncLogMapper.toDto(log));
  }

  async syncCampaignStatusFromAdNetwork(campaignId: string, adNetworkType: AdNetworkType): Promise<CampaignStatus> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    const externalRef = campaign.externalReferences?.find(ref => ref.adNetworkType === adNetworkType);
    if (!externalRef) {
      throw new BadRequestException(`Campaign not published to ${adNetworkType} or external reference missing.`);
    }

    try {
      const newStatus = await this.adNetworkIntegrationService.getCampaignStatus(adNetworkType, externalRef.externalId);
      if (campaign.status !== newStatus) {
        campaign.status = newStatus; // campaign.changeStatus(newStatus);
        await this.campaignRepository.save(campaign);
        // Log sync success in CampaignSyncLog
        // Dispatch CampaignStatusChangedEvent, CampaignSyncStatusUpdatedEvent
      }
      // Create a sync log entry
      const syncLog = new CampaignSyncLog(); // Populate with details
      syncLog.campaignId = campaign.id;
      syncLog.entityId = campaign.id;
      syncLog.entityType = 'CAMPAIGN';
      syncLog.adNetworkType = adNetworkType;
      syncLog.syncAttemptTime = new Date();
      syncLog.isSuccess = true;
      syncLog.responseDetails = { newStatus };
      await this.campaignSyncLogRepository.create(syncLog);

      return newStatus;
    } catch (error) {
      // Log sync failure in CampaignSyncLog
      const syncLog = new CampaignSyncLog(); // Populate with details
      syncLog.campaignId = campaign.id;
      syncLog.entityId = campaign.id;
      syncLog.entityType = 'CAMPAIGN';
      syncLog.adNetworkType = adNetworkType;
      syncLog.syncAttemptTime = new Date();
      syncLog.isSuccess = false;
      syncLog.errorMessage = error.message;
      await this.campaignSyncLogRepository.create(syncLog);

      throw new CampaignPublishException(adNetworkType, `Failed to sync status for campaign ${campaignId}: ${error.message}`, error);
    }
  }
}