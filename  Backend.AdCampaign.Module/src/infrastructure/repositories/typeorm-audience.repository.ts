import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience } from '../../domain/entities/audience.entity';
import { IAudienceRepository } from '../../domain/interfaces/repositories/audience.repository.interface';

@Injectable()
export class TypeOrmAudienceRepository implements IAudienceRepository {
  constructor(
    @InjectRepository(Audience)
    private readonly audienceOrmRepository: Repository<Audience>,
  ) {}

  async findById(id: string, merchantId: string): Promise<Audience | null> {
    return this.audienceOrmRepository.findOne({
      where: { id, merchantId },
    });
  }

  async findAll(merchantId: string): Promise<Audience[]> {
    return this.audienceOrmRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' }
    });
  }

  async save(audience: Audience): Promise<Audience> {
    return this.audienceOrmRepository.save(audience);
  }

  async remove(audience: Audience): Promise<void> {
    await this.audienceOrmRepository.remove(audience);
  }
}