import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppCategoryEntity, IAppCategoryRepository } from '../../domain';

@Injectable()
export class TypeOrmAppCategoryRepository implements IAppCategoryRepository {
  constructor(
    @InjectRepository(AppCategoryEntity)
    private readonly categoryOrmRepository: Repository<AppCategoryEntity>,
  ) {}

  async findById(id: string): Promise<AppCategoryEntity | null> {
    return this.categoryOrmRepository.findOne({ where: { id } });
  }
  
  async findByIds(ids: string[]): Promise<AppCategoryEntity[]> {
    return this.categoryOrmRepository.findByIds(ids); // TypeORM's `findByIds` is deprecated, use `In` operator with `find`
    // return this.categoryOrmRepository.find({ where: { id: In(ids) } });
  }


  async findAll(): Promise<AppCategoryEntity[]> {
    return this.categoryOrmRepository.find({ order: { name: 'ASC' } });
  }

  async findByName(name: string): Promise<AppCategoryEntity | null> {
    return this.categoryOrmRepository.findOne({ where: { name } });
  }

  async save(category: AppCategoryEntity): Promise<AppCategoryEntity> {
    return this.categoryOrmRepository.save(category);
  }

  async delete(id: string): Promise<{ affected?: number }> {
    // Check if category is in use before deleting, or handle DB constraints
    return this.categoryOrmRepository.delete(id);
  }
}