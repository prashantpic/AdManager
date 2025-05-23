import { Injectable } from '@nestjs/common';
import { Ad } from '../../domain/entities/ad.entity';
import { CreateAdDto } from '../dtos/ad/create-ad.dto';
import { UpdateAdDto } from '../dtos/ad/update-ad.dto';
import { AdDto } from '../dtos/ad/ad.dto';
import { CreativeMapper } from './creative.mapper';
import { AdCreativeContent } from '../../domain/value-objects/ad-creative-content.vo';
import { AdCreativeContentDto } from '../dtos/ad/ad-creative-content.dto';
import { AdNetworkReferenceDto } from '../dtos/sync/ad-network-reference.dto';

@Injectable()
export class AdMapper {
  constructor(private readonly creativeMapper: CreativeMapper) {}

  toDto(entity: Ad): AdDto {
    const dto = new AdDto();
    dto.id = entity.id;
    dto.adSetId = entity.adSet?.id;
    dto.name = entity.name;
    dto.creativeId = entity.creative?.id || null;
    // dto.creative = entity.creative ? this.creativeMapper.toDto(entity.creative) : null;
    dto.productIds = entity.productIds || [];
    dto.promotionIds = entity.promotionIds || [];
    dto.creativeType = entity.creativeType;
    
    if (entity.creativeContent) {
        dto.creativeContent = new AdCreativeContentDto();
        dto.creativeContent.headline = entity.creativeContent.headline;
        dto.creativeContent.description = entity.creativeContent.description;
        dto.creativeContent.bodyText = entity.creativeContent.bodyText;
        dto.creativeContent.callToActionText = entity.creativeContent.callToActionText;
    }

    dto.adNetworkReferences = entity.adNetworkReferences?.map(ref => {
        const refDto = new AdNetworkReferenceDto();
        refDto.adNetworkType = ref.adNetworkType;
        refDto.externalId = ref.externalId;
        return refDto;
    }) || [];

    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  extractCreationData(dto: CreateAdDto): {
    name: string;
    creativeId?: string;
    productIds?: string[];
    promotionIds?: string[];
    creativeType?: any; // This should be CreativeType enum
    creativeContent?: AdCreativeContent;
  } {
    return {
      name: dto.name,
      creativeId: dto.creativeId,
      productIds: dto.productIds,
      promotionIds: dto.promotionIds,
      creativeType: dto.creativeType,
      creativeContent: dto.creativeContent ? new AdCreativeContent(dto.creativeContent.headline, dto.creativeContent.description, dto.creativeContent.bodyText, dto.creativeContent.callToActionText) : undefined,
    };
  }

  applyUpdateDto(entity: Ad, dto: UpdateAdDto): Ad {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    // creativeId update is handled by application service linking
    if (dto.productIds !== undefined) {
      entity.productIds = dto.productIds;
    }
    if (dto.promotionIds !== undefined) {
      entity.promotionIds = dto.promotionIds;
    }
    if (dto.creativeType !== undefined) {
        entity.creativeType = dto.creativeType;
    }
    if (dto.creativeContent !== undefined) {
        entity.creativeContent = dto.creativeContent ? new AdCreativeContent(dto.creativeContent.headline, dto.creativeContent.description, dto.creativeContent.bodyText, dto.creativeContent.callToActionText) : undefined;
    }
    return entity;
  }
}