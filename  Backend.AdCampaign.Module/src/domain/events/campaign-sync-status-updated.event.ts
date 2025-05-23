import { AdNetworkType } from '../../constants/ad-network-type.enum';
import { SyncEntityType, SyncStatus } from '../entities/campaign-sync-log.entity';


export class CampaignSyncStatusUpdatedEvent {
  constructor(
    public readonly syncLogId: string,
    public readonly campaignId: string,
    public readonly entityId: string, // Could be campaignId, adSetId, or adId
    public readonly entityType: SyncEntityType,
    public readonly adNetworkType: AdNetworkType,
    public readonly status: SyncStatus,
    public readonly externalId?: string,
    public readonly errorMessage?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}