import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdSet } from '../../domain/entities/ad-set.entity';
import { IAdSetRepository } from '../../domain/interfaces/repositories/ad-set.repository.interface';

@Injectable()
export class TypeOrmAdSetRepository implements IAdSetRepository {
  constructor(
    @InjectRepository(AdSet)
    private readonly adSetOrmRepository: Repository<AdSet>,
  ) {}

  async findById(id: string, merchantId: string): Promise<AdSet | null> {
    // To ensure merchant ownership, we query through the campaign
    return this.adSetOrmRepository.findOne({
      where: { id, campaign: { merchantId } },
      relations: [
        'campaign', 
        'budget', 
        'schedule', 
        'targetAudience', 
        'ads',
        'ads.creative',
    ],
    });
  }

  async findByCampaignId(campaignId: string, merchantId: string): Promise<AdSet[]> {
    return this.adSetOrmRepository.find({
      where: { campaign: { id: campaignId, merchantId } },
      relations: ['budget', 'schedule', 'targetAudience', 'ads'],
      order: { createdAt: 'ASC' }
    });
  }

  async save(adSet: AdSet): Promise<AdSet> {
    return this.adSetOrmRepository.save(adSet);
  }

  async remove(adSet: AdSet): Promise<void> {
    await this.adSetOrmRepository.remove(adSet);
  }

  async findAllByCampaignIds(campaignIds: string[], merchantId: string): Promise<AdSet[]> {
    if (campaignIds.length === 0) return [];
    return this.adSetOrmRepository
        .createQueryBuilder('adSet')
        .leftJoinAndSelect('adSet.campaign', 'campaign')
        .leftJoinAndSelect('adSet.budget', 'budget')
        .leftJoinAndSelect('adSet.schedule', 'schedule')
        .where('campaign.merchantId = :merchantId', { merchantId })
        .andWhere('campaign.id IN (:...campaignIds)', { campaignIds })
        .getMany();
  }
}