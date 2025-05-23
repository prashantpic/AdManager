import { Injectable } from '@nestjs/common';
import { CampaignSyncLog } from '../../domain/entities/campaign-sync-log.entity';
import { CampaignSyncLogDto } from '../dtos/sync/campaign-sync-log.dto';

@Injectable()
export class CampaignSyncLogMapper {
  toDto(entity: CampaignSyncLog): CampaignSyncLogDto {
    const dto = new CampaignSyncLogDto();
    dto.id = entity.id;
    dto.campaignId = entity.campaign?.id;
    dto.adSetId = entity.adSet?.id || null;
    dto.adId = entity.ad?.id || null;
    dto.entityType = entity.entityType;
    dto.entityId = entity.entityId;
    dto.adNetworkType = entity.adNetworkType;
    dto.syncAttemptTime = entity.syncAttemptTime;
    dto.isSuccess = entity.isSuccess;
    dto.errorMessage = entity.errorMessage;
    // Be cautious about exposing raw request/response payloads. Sanitize or omit.
    // dto.requestPayload = entity.requestPayload;
    // dto.responseDetails = entity.responseDetails;
    dto.createdAt = entity.createdAt; // Assuming base entity has these
    dto.updatedAt = entity.updatedAt; // Assuming base entity has these
    return dto;
  }
}