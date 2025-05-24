```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, IsNull } from 'typeorm';
import { AppCommissionConfig } from '../../domain/entities/app-commission-config.entity';
import { IAppCommissionConfigRepository } from '../../domain/repositories/app-commission-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class TypeOrmAppCommissionConfigRepository implements IAppCommissionConfigRepository {
  constructor(
    @InjectRepository(AppCommissionConfig)
    private readonly repo: Repository<AppCommissionConfig>,
  ) {}

  async findById(id: string): Promise<AppCommissionConfig | null> {
    return this.repo.findOneBy({ id });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<AppCommissionConfig>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<AppCommissionConfig> = {
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

  async save(config: AppCommissionConfig): Promise<AppCommissionConfig> {
    return this.repo.save(config);
  }

  async findActiveConfigForAppOrDeveloper(
    appId: string,
    developerId: string,
    currency: string,
  ): Promise<AppCommissionConfig | null> {
    // Order of preference for finding the configuration:
    // 1. Specific appId and developerId
    // 2. Specific appId (developerId is null in config)
    // 3. Specific developerId (appId is null in config)
    // 4. Generic (both appId and developerId are null in config)
    // All must be active and match currency.

    const commonConditions = { isActive: true, currency };

    const conditions: FindOptionsWhere<AppCommissionConfig>[] = [
      { ...commonConditions, appId, developerId },
      { ...commonConditions, appId, developerId: IsNull() },
      { ...commonConditions, appId: IsNull(), developerId },
      { ...commonConditions, appId: IsNull(), developerId: IsNull() },
    ];

    for (const condition of conditions) {
      const config = await this.repo.findOne({ where: condition });
      if (config) {
        return config;
      }
    }

    return null;
  }
}
```