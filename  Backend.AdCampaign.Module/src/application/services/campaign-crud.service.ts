import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { Campaign } from '../../domain/entities/campaign.entity';
import { AdSet } from '../../domain/entities/ad-set.entity';
import { Ad } from '../../domain/entities/ad.entity';
import { CampaignStatus } from '../../constants/campaign-status.enum';

import { ICampaignRepository } from '../../domain/interfaces/repositories/campaign.repository.interface';
import { IAdSetRepository } from '../../domain/interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from '../../domain/interfaces/repositories/ad.repository.interface';
import { IAudienceRepository } from '../../domain/interfaces/repositories/audience.repository.interface';
import { ICreativeRepository } from '../../domain/interfaces/repositories/creative.repository.interface';
import { ICampaignSyncLogRepository } from '../../domain/interfaces/repositories/campaign-sync-log.repository.interface';

import { CampaignFactory } from '../../domain/domain-services/campaign-factory.service';
import { CampaignValidatorService } from '../../domain/domain-services/campaign-validator.service';
import { CampaignDuplicatorService } from '../../domain/domain-services/campaign-duplicator.service';

import { CampaignMapper } from '../mappers/campaign.mapper';
import { AdSetMapper } from '../mappers/ad-set.mapper';
import { AdMapper } from '../mappers/ad.mapper';
// AudienceMapper and CreativeMapper might be needed if directly manipulating those here,
// but typically audience/creative management is in their own services.

import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';
import { IEntitlementValidationService } from '../../domain/interfaces/services/entitlement-validation.interface';

import { CreateCampaignDto } from '../dtos/campaign/create-campaign.dto';
import { UpdateCampaignDto } from '../dtos/campaign/update-campaign.dto';
import { CampaignDto } from '../dtos/campaign/campaign.dto';
import { CreateAdSetDto } from '../dtos/ad-set/create-ad-set.dto';
import { UpdateAdSetDto } from '../dtos/ad-set/update-ad-set.dto';
import { AdSetDto } from '../dtos/ad-set/ad-set.dto';
import { CreateAdDto } from '../dtos/ad/create-ad.dto';
import { UpdateAdDto } from '../dtos/ad/update-ad.dto';
import { AdDto } from '../dtos/ad/ad.dto';

import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignCreationException } from '../../exceptions/campaign-creation.exception';
import { CampaignLimitException } from '../../exceptions/campaign-limit.exception';
import { IProductCatalogQueryService } from '../../domain/interfaces/services/product-catalog-query.interface';
import { IPromotionQueryService } from '../../domain/interfaces/services/promotion-query.interface';


@Injectable()
export class CampaignCrudService {
  constructor(
    @Inject(ICampaignRepository) private readonly campaignRepository: ICampaignRepository,
    @Inject(IAdSetRepository) private readonly adSetRepository: IAdSetRepository,
    @Inject(IAdRepository) private readonly adRepository: IAdRepository,
    // @Inject(IAudienceRepository) private readonly audienceRepository: IAudienceRepository, // If needed directly
    // @Inject(ICreativeRepository) private readonly creativeRepository: ICreativeRepository, // If needed directly
    // @Inject(ICampaignSyncLogRepository) private readonly campaignSyncLogRepository: ICampaignSyncLogRepository, // If needed directly
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
    @Inject(IEntitlementValidationService) private readonly entitlementService: IEntitlementValidationService,
    @Inject(IProductCatalogQueryService) private readonly productCatalogQueryService: IProductCatalogQueryService,
    @Inject(IPromotionQueryService) private readonly promotionQueryService: IPromotionQueryService,
    private readonly campaignFactory: CampaignFactory,
    private readonly campaignValidator: CampaignValidatorService,
    private readonly campaignDuplicator: CampaignDuplicatorService,
    private readonly campaignMapper: CampaignMapper,
    private readonly adSetMapper: AdSetMapper,
    private readonly adMapper: AdMapper,
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    await this.campaignValidator.validateCampaignCreation(merchantId, createCampaignDto);
    
    const campaign = await this.campaignFactory.createCampaign(createCampaignDto, merchantId);
    const savedCampaign = await this.campaignRepository.save(campaign);
    return this.campaignMapper.toDto(savedCampaign);
  }

  async getCampaignById(campaignId: string): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }
    return this.campaignMapper.toDto(campaign);
  }

  async getCampaignsByMerchantId(): Promise<CampaignDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaigns = await this.campaignRepository.findAll(merchantId);
    return campaigns.map(campaign => this.campaignMapper.toDto(campaign));
  }

  async updateCampaign(campaignId: string, updateCampaignDto: UpdateCampaignDto): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    let campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    await this.campaignValidator.validateCampaignUpdate(campaign, updateCampaignDto, merchantId);
    
    // Apply updates. This should be more sophisticated in a real app, using domain methods or mappers.
    // For simplicity, direct assignment or partial update for changeable fields.
    campaign = this.campaignMapper.fromUpdateDto(updateCampaignDto, campaign);

    const updatedCampaign = await this.campaignRepository.save(campaign);
    return this.campaignMapper.toDto(updatedCampaign);
  }

  async archiveCampaign(campaignId: string): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }
    if (campaign.status === CampaignStatus.ARCHIVED) {
        return; // Already archived
    }
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.PENDING_REVIEW) {
        // Potentially requires interaction with ad networks to pause/archive externally first.
        // This simplified version directly archives internally.
        // throw new BadRequestException('Cannot archive an active or pending review campaign directly. Please pause it first.');
    }
    campaign.status = CampaignStatus.ARCHIVED;
    // campaign.archivedAt = new Date(); // Assuming entity has archive() method or similar
    await this.campaignRepository.save(campaign);
  }

  async duplicateCampaign(campaignId: string): Promise<CampaignDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    // Check entitlement for duplication if it's a premium feature
    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'CAMPAIGN_DUPLICATION')) {
        throw new CampaignLimitException('Campaign duplication feature not available for your plan.');
    }

    const originalCampaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!originalCampaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }

    const newCampaign = await this.campaignDuplicator.duplicateCampaign(originalCampaign, merchantId);
    const savedCampaign = await this.campaignRepository.save(newCampaign);
    return this.campaignMapper.toDto(savedCampaign);
  }

  async createAdSet(campaignId: string, createAdSetDto: CreateAdSetDto): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const campaign = await this.campaignRepository.findById(campaignId, merchantId);
    if (!campaign) {
      throw new EntityNotFoundException('Campaign', campaignId);
    }
    if (createAdSetDto.campaignId !== campaignId) {
        throw new BadRequestException('Campaign ID in DTO does not match path parameter.');
    }

    await this.campaignValidator.validateAdSetCreation(campaign, createAdSetDto, merchantId);

    const adSet = this.adSetMapper.fromCreateDto(createAdSetDto, campaign); // Mapper to create AdSet entity
    const savedAdSet = await this.adSetRepository.save(adSet);
    // campaign.addAdSet(savedAdSet); // Assuming Campaign entity has this method
    // await this.campaignRepository.save(campaign); // If AdSet is part of Campaign aggregate and cascade save is configured
    return this.adSetMapper.toDto(savedAdSet);
  }

  async updateAdSet(adSetId: string, updateAdSetDto: UpdateAdSetDto): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    let adSet = await this.adSetRepository.findById(adSetId, merchantId); // Ensure findById takes merchantId
    if (!adSet) {
      throw new EntityNotFoundException('AdSet', adSetId);
    }

    const campaign = await this.campaignRepository.findById(adSet.campaignId, merchantId);
     if (!campaign) {
      throw new EntityNotFoundException('Campaign for AdSet', adSet.campaignId);
    }

    await this.campaignValidator.validateAdSetUpdate(adSet, updateAdSetDto, merchantId, campaign);

    adSet = this.adSetMapper.fromUpdateDto(updateAdSetDto, adSet);
    const updatedAdSet = await this.adSetRepository.save(adSet);
    return this.adSetMapper.toDto(updatedAdSet);
  }

  async getAdSetById(adSetId: string): Promise<AdSetDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const adSet = await this.adSetRepository.findById(adSetId, merchantId);
    if (!adSet) {
      throw new EntityNotFoundException('AdSet', adSetId);
    }
    return this.adSetMapper.toDto(adSet);
  }

  async getAdsByAdSetId(adSetId: string): Promise<AdDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    const adSet = await this.adSetRepository.findById(adSetId, merchantId);
    if (!adSet) {
      throw new EntityNotFoundException('AdSet', adSetId);
    }
    const ads = await this.adRepository.findByAdSetId(adSetId, merchantId);
    return ads.map(ad => this.adMapper.toDto(ad));
  }
  
  async createAd(adSetId: string, createAdDto: CreateAdDto): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const adSet = await this.adSetRepository.findById(adSetId, merchantId);
    if (!adSet) {
      throw new EntityNotFoundException('AdSet', adSetId);
    }
     if (createAdDto.adSetId !== adSetId) {
        throw new BadRequestException('AdSet ID in DTO does not match path parameter.');
    }

    await this.campaignValidator.validateAdCreation(adSet, createAdDto, merchantId);

    const ad = this.adMapper.fromCreateDto(createAdDto, adSet); // Mapper creates Ad entity
    const savedAd = await this.adRepository.save(ad);
    // adSet.addAd(savedAd); // Assuming AdSet entity has this method
    // await this.adSetRepository.save(adSet); // If Ad is part of AdSet aggregate and cascade save is configured
    return this.adMapper.toDto(savedAd);
  }

  async updateAd(adId: string, updateAdDto: UpdateAdDto): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    let ad = await this.adRepository.findById(adId, merchantId); // Ensure findById takes merchantId
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    const adSet = await this.adSetRepository.findById(ad.adSetId, merchantId);
    if (!adSet) {
     throw new EntityNotFoundException('AdSet for Ad', ad.adSetId);
    }

    await this.campaignValidator.validateAdUpdate(ad, updateAdDto, merchantId, adSet);
    
    ad = this.adMapper.fromUpdateDto(updateAdDto, ad);
    const updatedAd = await this.adRepository.save(ad);
    return this.adMapper.toDto(updatedAd);
  }

   async getAdById(adId: string): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }
    return this.adMapper.toDto(ad);
  }
}