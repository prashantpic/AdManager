```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { PromotedListingConfig } from '../../domain/entities/promoted-listing-config.entity';
import { IPromotedListingConfigRepository } from '../../domain/repositories/promoted-listing-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class TypeOrmPromotedListingConfigRepository implements IPromotedListingConfigRepository {
  constructor(
    @InjectRepository(PromotedListingConfig)
    private readonly repo: Repository<PromotedListingConfig>,
  ) {}

  async findById(id: string): Promise<PromotedListingConfig | null> {
    return this.repo.findOneBy({ id });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<PromotedListingConfig>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<PromotedListingConfig> = {
      skip,
      take: limit,
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { createdAt: 'DESC' };
    }
    
    const [entities, total] = await this.repo.findAndCount(findOptions);

    return {
      data: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(config: PromotedListingConfig): Promise<PromotedListingConfig> {
    return this.repo.save(config);
  }
}
```