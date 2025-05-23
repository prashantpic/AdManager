import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAdNetworkIntegrationService } from '../../domain/interfaces/services/ad-network-integration.interface';
import { ICampaignRepository } from '../../domain/interfaces/repositories/campaign.repository.interface';
import { IAdSetRepository } from '../../domain/interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from '../../domain/interfaces/repositories/ad.repository.interface';
import { ICreativeRepository } from '../../domain/interfaces/repositories/creative.repository.interface';
import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';
import { AdNetworkType } from '../../constants/ad-network-type.enum';
import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignPublishException } from '../../exceptions/campaign-publish.exception'; // Re-use for preview errors
import { IEntitlementValidationService } from '../../domain/interfaces/services/entitlement-validation.interface';
import { CampaignLimitException } from '../../exceptions/campaign-limit.exception';


@Injectable()
export class CampaignPreviewService {
  constructor(
    @Inject(IAdNetworkIntegrationService) private readonly adNetworkIntegrationService: IAdNetworkIntegrationService,
    @Inject(ICampaignRepository) private readonly campaignRepository: ICampaignRepository,
    @Inject(IAdSetRepository) private readonly adSetRepository: IAdSetRepository,
    @Inject(IAdRepository) private readonly adRepository: IAdRepository,
    @Inject(ICreativeRepository) private readonly creativeRepository: ICreativeRepository,
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
    @Inject(IEntitlementValidationService) private readonly entitlementService: IEntitlementValidationService,
  ) {}

  async generateAdPreview(adId: string, adNetworkType: AdNetworkType): Promise<any> { // 'any' should be a PreviewData DTO
    const merchantId = this.userContextProvider.getMerchantId();

    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, `AD_PREVIEW_${adNetworkType}`)) {
        throw new CampaignLimitException(`Ad preview for ${adNetworkType} is not available for your plan.`);
    }

    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    const adSet = await this.adSetRepository.findById(ad.adSetId, merchantId);
    if (!adSet) {
      throw new EntityNotFoundException('AdSet', ad.adSetId);
    }
    
    const campaign = await this.campaignRepository.findById(adSet.campaignId, merchantId);
     if (!campaign) {
      throw new EntityNotFoundException('Campaign', adSet.campaignId);
    }

    if (!ad.creativeId) {
        throw new BadRequestException(`Ad ${adId} does not have an associated creative for preview.`);
    }
    const creative = await this.creativeRepository.findById(ad.creativeId, merchantId);
    if (!creative) {
      throw new EntityNotFoundException('Creative', ad.creativeId);
    }
    
    // The IAdNetworkIntegrationService.getCampaignPreview might take various forms of data.
    // It might need the full campaign, adset, ad, creative objects, or a specific DTO.
    // For simplicity, we pass the core entities. The adapter should handle mapping.
    const campaignData = { // This structure depends on what the integration service expects
        campaign,
        adSet,
        ad,
        creative,
        // Potentially audience data if needed for preview context
        // audience: adSet.targetAudienceId ? await this.audienceRepository.findById(adSet.targetAudienceId, merchantId) : null
    };

    try {
      const previewData = await this.adNetworkIntegrationService.getCampaignPreview(adNetworkType, campaignData);
      return previewData; // e.g., { previewUrl: '...', thumbnailUrl: '...' }
    } catch (error) {
      // Log detailed error
      throw new CampaignPublishException(
        adNetworkType,
        `Failed to generate ad preview for ad ${adId}: ${error.message}`,
        error,
      );
    }
  }
}