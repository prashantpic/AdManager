import { AppEntity } from '../app/entities/app.entity';
import { SearchFilterQueryDto } from '../../application/dtos/common/search-filter-query.dto';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';

// Placeholder for a generic pagination result structure
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IAppRepository {
  findById(id: string): Promise<AppEntity | null>;
  findAll(pagination?: PaginationQueryDto): Promise<PaginatedResult<AppEntity>>;
  findPublishedApps(
    filters: SearchFilterQueryDto,
    pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<AppEntity>>;
  findByDeveloperId(developerId: string, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppEntity>>;
  save(app: AppEntity): Promise<AppEntity>;
  delete(id: string): Promise<void>;
  findByNameAndDeveloperId(name: string, developerId: string): Promise<AppEntity | null>;
}