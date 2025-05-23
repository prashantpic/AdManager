import { CampaignSyncLog, SyncEntityType } from '../../entities/campaign-sync-log.entity';

export interface ICampaignSyncLogRepository {
  create(log: Partial<CampaignSyncLog>): Promise<CampaignSyncLog>;
  save(log: CampaignSyncLog): Promise<CampaignSyncLog>;
  findById(id: string): Promise<CampaignSyncLog | null>;
  findByCampaignId(campaignId: string): Promise<CampaignSyncLog[]>;
  findByEntity(entityId: string, entityType: SyncEntityType): Promise<CampaignSyncLog[]>;
  findLatestForEntity(
    entityId: string,
    entityType: SyncEntityType,
    adNetworkType: string, // AdNetworkType enum as string
  ): Promise<CampaignSyncLog | null>;
}

export const ICampaignSyncLogRepository = Symbol('ICampaignSyncLogRepository');