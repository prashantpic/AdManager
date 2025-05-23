import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Campaign } from '../../domain/entities/campaign.entity';
import { ICampaignRepository } from '../../domain/interfaces/repositories/campaign.repository.interface';
import { CampaignStatus } from '../../constants';

@Injectable()
export class TypeOrmCampaignRepository implements ICampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignOrmRepository: Repository<Campaign>,
  ) {}

  async findById(id: string, merchantId: string): Promise<Campaign | null> {
    return this.campaignOrmRepository.findOne({
      where: { id, merchantId },
      relations: [
        'budget', 
        'schedule', 
        'targetAudience', 
        'adSets', 
        'adSets.budget', 
        'adSets.schedule', 
        'adSets.targetAudience', 
        'adSets.ads',
        'adSets.ads.creative',
        // 'syncLogs' // Potentially large, load on demand
    ],
    });
  }

  async findAll(merchantId: string, filters?: { status?: CampaignStatus, objective?: string, ids?: string[] }): Promise<Campaign[]> {
    const whereClause: FindOptionsWhere<Campaign> = { merchantId };
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.objective) {
      // Assuming objective is stored as string or enum
      whereClause.objective = filters.objective as any; 
    }
    if (filters?.ids && filters.ids.length > 0) {
        whereClause.id = In(filters.ids);
    }

    return this.campaignOrmRepository.find({
      where: whereClause,
      relations: ['budget', 'schedule', 'targetAudience'], // Lighter load for list views
      order: { createdAt: 'DESC' }
    });
  }

  async save(campaign: Campaign): Promise<Campaign> {
    return this.campaignOrmRepository.save(campaign);
  }

  async remove(campaign: Campaign): Promise<void> {
    // TypeORM's remove typically requires the entity instance.
    // If only ID is available, one might use delete(id).
    // Soft delete (setting status to ARCHIVED) is handled in domain/application layer.
    // This remove should be a hard delete if that's the intent.
    await this.campaignOrmRepository.remove(campaign);
  }

  async findByStatus(merchantId: string, status: CampaignStatus): Promise<Campaign[]> {
    return this.campaignOrmRepository.find({
        where: { merchantId, status },
        relations: ['budget', 'schedule'],
    });
  }
}