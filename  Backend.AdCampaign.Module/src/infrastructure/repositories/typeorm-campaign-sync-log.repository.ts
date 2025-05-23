import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignSyncLog } from '../../domain/entities/campaign-sync-log.entity';
import { ICampaignSyncLogRepository } from '../../domain/interfaces/repositories/campaign-sync-log.repository.interface';

@Injectable()
export class TypeOrmCampaignSyncLogRepository
  implements ICampaignSyncLogRepository
{
  constructor(
    @InjectRepository(CampaignSyncLog)
    private readonly syncLogOrmRepository: Repository<CampaignSyncLog>,
  ) {}

  async save(log: CampaignSyncLog): Promise<CampaignSyncLog> {
    return this.syncLogOrmRepository.save(log);
  }

  async findByCampaignId(
    campaignId: string,
    merchantId: string, // To ensure logs are fetched for the correct merchant via campaign
  ): Promise<CampaignSyncLog[] | null> {
    return this.syncLogOrmRepository.find({
      where: { campaign: { id: campaignId, merchantId } },
      relations: ['campaign', 'adSet', 'ad'], // Eager load related entities if needed
      order: { syncAttemptTime: 'DESC' },
    });
  }

  async findByEntityId(
    entityId: string,
    entityType: 'CAMPAIGN' | 'AD_SET' | 'AD',
    merchantId: string,
  ): Promise<CampaignSyncLog[]> {
     // This query is a bit more complex as it needs to check merchantId through different paths
     // For simplicity, this example assumes entityId is campaignId if entityType is CAMPAIGN
     if (entityType === 'CAMPAIGN') {
        return this.syncLogOrmRepository.find({
            where: { entityId, entityType, campaign: { merchantId } },
            order: { syncAttemptTime: 'DESC' },
        });
     }
     // For AD_SET or AD, a more complex query joining through campaign would be needed
     // or the merchantId check relies on the calling service having already validated ownership.
     // For now, we'll assume the caller ensures the entityId belongs to the merchant.
     return this.syncLogOrmRepository.find({
        where: { entityId, entityType },
        order: { syncAttemptTime: 'DESC' },
     });
  }
}