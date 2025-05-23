import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Creative } from '../../domain/entities/creative.entity';
import { Ad } from '../../domain/entities/ad.entity';
import { CreativeType } from '../../constants/creative-type.enum';
import { AssetLocation } from '../../domain/value-objects/asset-location.vo';
import { AdCreativeContent } from '../../domain/value-objects/ad-creative-content.vo';

import { ICreativeRepository } from '../../domain/interfaces/repositories/creative.repository.interface';
import { IAdRepository } from '../../domain/interfaces/repositories/ad.repository.interface';
import { IAssetStorageService } from '../../domain/interfaces/services/asset-storage.interface';
import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';
import { IEntitlementValidationService } from '../../domain/interfaces/services/entitlement-validation.interface';

import { CreativeMapper } from '../mappers/creative.mapper';
import { AdMapper } from '../mappers/ad.mapper'; // For returning AdDto after association

import { UploadCreativeAssetDto } from '../dtos/creative/upload-creative-asset.dto';
import { AssociateCreativeDto } from '../dtos/creative/associate-creative.dto'; // Assuming this DTO exists for content
import { CreativeDto } from '../dtos/creative/creative.dto';
import { AdDto } from '../dtos/ad/ad.dto';


import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CreativeAssetUploadException } from '../../exceptions/creative-asset-upload.exception';
import { CampaignLimitException } from '../../exceptions/campaign-limit.exception';
import { InvalidAudienceDataException } from '../../exceptions/invalid-audience-data.exception'; // Re-use for invalid creative content

// Multer types for file handling
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}


@Injectable()
export class CreativeManagementService {
  constructor(
    @Inject(ICreativeRepository) private readonly creativeRepository: ICreativeRepository,
    @Inject(IAdRepository) private readonly adRepository: IAdRepository,
    @Inject(IAssetStorageService) private readonly assetStorageService: IAssetStorageService,
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
    @Inject(IEntitlementValidationService) private readonly entitlementService: IEntitlementValidationService,
    private readonly creativeMapper: CreativeMapper,
    private readonly adMapper: AdMapper,
  ) {}

  async uploadCreativeAsset(
    uploadDto: UploadCreativeAssetDto,
    file: MulterFile, // Express.Multer.File
  ): Promise<CreativeDto> {
    const merchantId = this.userContextProvider.getMerchantId();

    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'CREATIVE_UPLOAD')) {
        throw new CampaignLimitException('Creative asset upload is not available for your plan.');
    }
    // Check storage limits if applicable
    // const currentStorageUsage = await this.assetStorageService.getMerchantUsage(merchantId); // Fictional method
    // if (!await this.entitlementService.checkUsageLimit(merchantId, 'MAX_STORAGE_MB', currentStorageUsage + file.size / (1024*1024) )) {
    //     throw new CampaignLimitException('Storage limit reached.');
    // }

    let assetLocation: AssetLocation;
    try {
      assetLocation = await this.assetStorageService.uploadAsset(
        merchantId,
        file.buffer,
        file.originalname,
        file.mimetype,
      );
    } catch (error) {
      throw new CreativeAssetUploadException(`Failed to upload asset: ${error.message}`, error);
    }

    const creative = this.creativeMapper.fromUploadDto(uploadDto, assetLocation, merchantId);
    // If type is TEXT, content might be part of uploadDto directly
    if (uploadDto.type === CreativeType.TEXT && uploadDto.content) {
        try {
            creative.content = new AdCreativeContent(uploadDto.content.headline, uploadDto.content.description, uploadDto.content.bodyText, uploadDto.content.callToActionText);
        } catch(validationError) {
            await this.assetStorageService.deleteAsset(assetLocation); // Rollback asset upload
            throw new InvalidAudienceDataException(`Invalid creative content: ${validationError.message}`);
        }
    }

    const savedCreative = await this.creativeRepository.save(creative);
    return this.creativeMapper.toDto(savedCreative);
  }

  async createCreative(
    data: { name: string; type: CreativeType; assetLocation?: AssetLocation; content?: AdCreativeContent },
    // file?: MulterFile - if combined with upload
  ): Promise<CreativeDto> {
    const merchantId = this.userContextProvider.getMerchantId();
     if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'CREATIVE_MANAGEMENT')) {
        throw new CampaignLimitException('Creative management is not available for your plan.');
    }

    const creative = new Creative();
    creative.merchantId = merchantId;
    creative.name = data.name;
    creative.type = data.type;
    if (data.assetLocation) {
        creative.assetLocation = data.assetLocation;
    }
    if (data.content) {
        // Ensure AdCreativeContent is properly instantiated and validated if passed as raw object
        creative.content = (data.content instanceof AdCreativeContent) ? data.content : new AdCreativeContent(
            data.content.headline, data.content.description, data.content.bodyText, data.content.callToActionText
        );
    }

    if (creative.type !== CreativeType.TEXT && !creative.assetLocation) {
        throw new BadRequestException('Asset location is required for non-text creatives.');
    }
    if (creative.type === CreativeType.TEXT && !creative.content) {
        throw new BadRequestException('Content is required for text creatives.');
    }

    const savedCreative = await this.creativeRepository.save(creative);
    return this.creativeMapper.toDto(savedCreative);
  }

  async associateCreativeToAd(adId: string, associateDto: AssociateCreativeDto): Promise<AdDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    const creative = await this.creativeRepository.findById(associateDto.creativeId, merchantId);
    if (!creative) {
      throw new EntityNotFoundException('Creative', associateDto.creativeId);
    }

    // Validate if creative type is compatible with ad type/platform (more complex validation)
    // ad.creativeId = creative.id;
    ad.creative = creative; // Assuming entity relation
    
    if (associateDto.adCreativeContent) { // If ad-specific content overrides/augments creative's base content
        try {
            ad.creativeContent = new AdCreativeContent(
                associateDto.adCreativeContent.headline,
                associateDto.adCreativeContent.description,
                associateDto.adCreativeContent.bodyText,
                associateDto.adCreativeContent.callToActionText
            );
        } catch (validationError) {
            throw new InvalidAudienceDataException(`Invalid ad-specific creative content: ${validationError.message}`);
        }
    } else if (creative.content) { // Use creative's own content if no ad-specific override
        ad.creativeContent = creative.content;
    } else if (creative.type === CreativeType.TEXT) {
        throw new BadRequestException('Ad-specific creative content is required for text creatives if not set on creative itself.')
    }


    const updatedAd = await this.adRepository.save(ad);
    return this.adMapper.toDto(updatedAd);
  }

  async getCreativeById(creativeId: string): Promise<CreativeDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const creative = await this.creativeRepository.findById(creativeId, merchantId);
    if (!creative) {
      throw new EntityNotFoundException('Creative', creativeId);
    }
    return this.creativeMapper.toDto(creative);
  }

  async getCreativesByMerchantId(): Promise<CreativeDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    const creatives = await this.creativeRepository.findAll(merchantId);
    return creatives.map(creative => this.creativeMapper.toDto(creative));
  }

  async deleteCreative(creativeId: string): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const creative = await this.creativeRepository.findById(creativeId, merchantId);
    if (!creative) {
      throw new EntityNotFoundException('Creative', creativeId);
    }

    // Check if creative is in use by any ads (could be complex if ads are numerous)
    // const adsUsingCreative = await this.adRepository.findByCreativeId(creativeId, merchantId);
    // if (adsUsingCreative.length > 0) {
    //   throw new BadRequestException('Cannot delete creative that is currently associated with one or more ads.');
    // }

    if (creative.assetLocation) {
      try {
        await this.assetStorageService.deleteAsset(creative.assetLocation);
      } catch (error) {
        // Log error but proceed with deleting DB record, or handle as critical failure
        console.error(`Failed to delete asset from storage for creative ${creativeId}: ${error.message}`);
      }
    }
    await this.creativeRepository.remove(creative);
  }
}