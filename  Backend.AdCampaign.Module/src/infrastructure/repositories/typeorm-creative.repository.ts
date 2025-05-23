import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Creative } from '../../domain/entities/creative.entity';
import { ICreativeRepository } from '../../domain/interfaces/repositories/creative.repository.interface';

@Injectable()
export class TypeOrmCreativeRepository implements ICreativeRepository {
  constructor(
    @InjectRepository(Creative)
    private readonly creativeOrmRepository: Repository<Creative>,
  ) {}

  async findById(id: string, merchantId: string): Promise<Creative | null> {
    return this.creativeOrmRepository.findOne({
      where: { id, merchantId },
    });
  }

  async findAll(merchantId: string): Promise<Creative[]> {
    return this.creativeOrmRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' }
    });
  }

  async save(creative: Creative): Promise<Creative> {
    return this.creativeOrmRepository.save(creative);
  }

  async remove(creative: Creative): Promise<void> {
    await this.creativeOrmRepository.remove(creative);
  }
}