import { AppCategoryEntity } from '../category/entities/app-category.entity';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';
import { PaginatedResult } from './app.repository.interface';

export interface IAppCategoryRepository {
  findById(id: string): Promise<AppCategoryEntity | null>;
  findAll(pagination?: PaginationQueryDto): Promise<PaginatedResult<AppCategoryEntity>>;
  findByName(name: string): Promise<AppCategoryEntity | null>;
  save(category: AppCategoryEntity): Promise<AppCategoryEntity>;
  delete(id: string): Promise<void>;
}