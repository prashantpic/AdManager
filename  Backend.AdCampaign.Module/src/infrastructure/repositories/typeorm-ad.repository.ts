import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad } from '../../domain/entities/ad.entity';
import { IAdRepository } from '../../domain/interfaces/repositories/ad.repository.interface';

@Injectable()
export class TypeOrmAdRepository implements IAdRepository {
  constructor(
    @InjectRepository(Ad)
    private readonly adOrmRepository: Repository<Ad>,
  ) {}

  async findById(id: string, merchantId: string): Promise<Ad | null> {
    // Query through AdSet and Campaign to ensure merchant ownership
    return this.adOrmRepository.findOne({
      where: { id, adSet: { campaign: { merchantId } } },
      relations: ['adSet', 'adSet.campaign', 'creative'],
    });
  }

  async findByAdSetId(adSetId: string, merchantId: string): Promise<Ad[]> {
    return this.adOrmRepository.find({
      where: { adSet: { id: adSetId, campaign: { merchantId } } },
      relations: ['creative'],
      order: { createdAt: 'ASC' }
    });
  }

  async save(ad: Ad): Promise<Ad> {
    return this.adOrmRepository.save(ad);
  }

  async remove(ad: Ad): Promise<void> {
    await this.adOrmRepository.remove(ad);
  }

  async findAllByAdSetIds(adSetIds: string[], merchantId: string): Promise<Ad[]> {
    if (adSetIds.length === 0) return [];
    return this.adOrmRepository
        .createQueryBuilder('ad')
        .leftJoinAndSelect('ad.adSet', 'adSet')
        .leftJoinAndSelect('adSet.campaign', 'campaign')
        .leftJoinAndSelect('ad.creative', 'creative')
        .where('campaign.merchantId = :merchantId', { merchantId })
        .andWhere('adSet.id IN (:...adSetIds)', { adSetIds })
        .getMany();
    }
}