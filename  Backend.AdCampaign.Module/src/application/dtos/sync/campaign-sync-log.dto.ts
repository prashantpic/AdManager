import { AdNetworkType } from '../../../constants/ad-network-type.enum';
import { SyncEntityType, SyncStatus } from '../../../domain/entities/campaign-sync-log.entity';

export class CampaignSyncLogDto {
  id: string;
  campaignId: string;
  adSetId?: string | null;
  adId?: string | null;
  entityType: SyncEntityType;
  entityId: string;
  adNetworkType: AdNetworkType;
  syncAttemptTime: Date;
  status: SyncStatus;
  errorMessage?: string | null;
  externalId?: string | null;
  requestPayload?: any | null; // Sensitive data should be sanitized/omitted
  responseDetails?: any | null; // Sensitive data should be sanitized/omitted
  syncAction?: string | null;
}