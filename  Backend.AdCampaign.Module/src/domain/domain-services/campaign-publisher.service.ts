import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AdNetworkType, CampaignStatus } from '../../constants';
import { Campaign } from '../entities/campaign.entity';
import { ICampaignRepository } from '../interfaces/repositories/campaign.repository.interface';
import { IAdNetworkIntegrationService } from '../interfaces/services/ad-network-integration.interface';
import { ICampaignSyncLogRepository } from '../interfaces/repositories/campaign-sync-log.repository.interface';
import { CampaignSyncLog } from '../entities/campaign-sync-log.entity';
import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignPublishException } from '../../exceptions/campaign-publish.exception';
import { CampaignPublishedEvent } from '../events/campaign-published.event';
import { CampaignSyncStatusUpdatedEvent } from '../events/campaign-sync-status-updated.event';
import { AdNetworkReference } from '../value-objects/ad-network-reference.vo';
import { IAdSetRepository } from '../interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from '../interfaces/repositories/ad.repository.interface';

@Injectable()
export class CampaignPublisherService {
  private readonly logger = new Logger(CampaignPublisherService.name);

  constructor(
    @Inject('ICampaignRepository')
    private readonly campaignRepository: ICampaignRepository,
    @Inject('IAdSetRepository') // As per SDS
    private readonly adSetRepository: IAdSetRepository,
    @Inject('IAdRepository') // As per SDS
    private readonly adRepository: IAdRepository,
    @Inject('IAdNetworkIntegrationService')
    private readonly adNetworkIntegrationService: IAdNetworkIntegrationService,
    @Inject('ICampaignSyncLogRepository')
    private readonly campaignSyncLogRepository: ICampaignSyncLogRepository,
    private readonly eventBus: EventBus,
  ) {}

  async publishCampaign(
    campaignId: string,
    merchantId: string,
    adNetworkType: AdNetworkType,
  ): Promise<void> {
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.REJECTED) {
      throw new CampaignPublishException(
        `Campaign with status ${campaign.status} cannot be published directly.`, adNetworkType
      );
    }

    let syncLog = new CampaignSyncLog();
    syncLog.campaign = campaign;
    syncLog.entityId = campaign.id;
    syncLog.entityType = 'CAMPAIGN';
    syncLog.adNetworkType = adNetworkType;
    syncLog.syncAttemptTime = new Date();
    syncLog.requestPayload = { 
        // Sanitize or select specific fields for logging
        campaignName: campaign.name,
        objective: campaign.objective,
        // Do not log sensitive budget/schedule details directly unless necessary and secured
    };


    try {
      // The adNetworkIntegrationService.publishCampaign expects full campaign data.
      // Ensure campaign entity has AdSets, Ads, Audience, Creatives loaded if needed by the adapter.
      // The SDS for IAdNetworkIntegrationService.publishCampaign takes (campaign: Campaign).
      // It implies the service expects the rich domain model or a specific structure.
      // For now, we pass the campaign entity, assuming the adapter handles mapping.
      const result = await this.adNetworkIntegrationService.publishCampaign(campaign, adNetworkType);

      campaign.addAdNetworkReference(new AdNetworkReference(adNetworkType, result.externalId));
      campaign.status = CampaignStatus.PENDING_REVIEW; // Or ACTIVE, depending on network flow

      // Update AdSets and Ads with their external IDs if returned by the integration
      if (result.adSetExternalIds) {
        for (const adSetRef of result.adSetExternalIds) {
            const adSet = campaign.adSets.find(as => as.id === adSetRef.localId);
            if (adSet) {
                adSet.addAdNetworkReference(new AdNetworkReference(adNetworkType, adSetRef.externalId));
                await this.adSetRepository.save(adSet); // Save individual adSet
            }
        }
      }
      if (result.adExternalIds) {
        for (const adRef of result.adExternalIds) {
            const ad = campaign.adSets.flatMap(as => as.ads).find(a => a.id === adRef.localId);
            if (ad) {
                ad.addAdNetworkReference(new AdNetworkReference(adNetworkType, adRef.externalId));
                await this.adRepository.save(ad); // Save individual ad
            }
        }
      }
      
      await this.campaignRepository.save(campaign);

      syncLog.isSuccess = true;
      syncLog.responseDetails = { externalId: result.externalId };
      await this.campaignSyncLogRepository.save(syncLog);

      this.eventBus.publish(
        new CampaignPublishedEvent(campaign.id, merchantId, adNetworkType, result.externalId),
      );
      this.eventBus.publish(
        new CampaignSyncStatusUpdatedEvent(
          campaign.id,
          'CAMPAIGN',
          adNetworkType,
          true,
          undefined,
          new Date(),
          result.externalId
        ),
      );

    } catch (error) {
      this.logger.error(
        `Failed to publish campaign ${campaignId} to ${adNetworkType}`,
        error.stack,
      );
      syncLog.isSuccess = false;
      syncLog.errorMessage = error.message;
      syncLog.responseDetails = error.response || { detail: 'Unknown integration error' };
      await this.campaignSyncLogRepository.save(syncLog);
      
      campaign.status = CampaignStatus.ERROR; // Mark campaign as having an error
      await this.campaignRepository.save(campaign);

      this.eventBus.publish(
        new CampaignSyncStatusUpdatedEvent(
          campaign.id,
          'CAMPAIGN',
          adNetworkType,
          false,
          error.message,
          new Date(),
        ),
      );
      throw new CampaignPublishException(
        `Failed to publish campaign to ${adNetworkType}: ${error.message}`,
        adNetworkType,
        error
      );
    }
  }
}