import { Injectable } from '@nestjs/common';
import { Creative } from '../../domain/entities/creative.entity';
import { CreativeDto } from '../dtos/creative/creative.dto';
import { UploadCreativeAssetDto } from '../dtos/creative/upload-creative-asset.dto';
import { AssetLocation } from '../../domain/value-objects/asset-location.vo';
import { AdCreativeContent } from '../../domain/value-objects/ad-creative-content.vo';
import { AdCreativeContentDto } from '../dtos/ad/ad-creative-content.dto';
import { AssetLocationDto } from '../dtos/creative/asset-location.dto';

@Injectable()
export class CreativeMapper {
  toDto(entity: Creative): CreativeDto {
    const dto = new CreativeDto();
    dto.id = entity.id;
    dto.merchantId = entity.merchantId;
    dto.name = entity.name;
    dto.type = entity.type;
    
    if (entity.assetLocation) {
        dto.assetLocation = new AssetLocationDto();
        dto.assetLocation.storageType = entity.assetLocation.storageType;
        dto.assetLocation.uri = entity.assetLocation.uri;
    }

    if (entity.content) {
        dto.content = new AdCreativeContentDto();
        dto.content.headline = entity.content.headline;
        dto.content.description = entity.content.description;
        dto.content.bodyText = entity.content.bodyText;
        dto.content.callToActionText = entity.content.callToActionText;
    }
    
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  extractCreationDataFromUpload(
    dto: UploadCreativeAssetDto,
    assetLocation: AssetLocation,
    merchantId: string,
    // creativeName property from UploadCreativeAssetDto is used for the entity name.
  ): {
    name: string;
    type: any; // This should be CreativeType enum
    assetLocation: AssetLocation;
    merchantId: string;
    content?: AdCreativeContent; // Content is usually ad-specific or set later
  } {
    return {
      merchantId,
      name: dto.name, 
      type: dto.type,
      assetLocation,
      // Content is typically not set at initial asset upload, but could be
    };
  }

  // For creating creative directly with content (e.g. text ads)
  extractCreationData(data: { 
    name: string, 
    type: any, // CreativeType 
    assetLocation?: AssetLocation, 
    content?: AdCreativeContent 
  }, merchantId: string): Partial<Creative> {
    return {
        merchantId,
        name: data.name,
        type: data.type,
        assetLocation: data.assetLocation,
        content: data.content
    };
  }
}