```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { DeveloperPayout } from '../../domain/entities/developer-payout.entity';
import { IDeveloperPayoutRepository } from '../../domain/repositories/developer-payout.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PayoutStatus } from '../../../common/enums/payout-status.enum';

@Injectable()
export class TypeOrmDeveloperPayoutRepository implements IDeveloperPayoutRepository {
  constructor(
    @InjectRepository(DeveloperPayout)
    private readonly repo: Repository<DeveloperPayout>,
  ) {}

  async findById(id: string): Promise<DeveloperPayout | null> {
    return this.repo.findOne({ 
        where: { id },
        relations: ['commissions', 'commissions.appCommissionConfig']
    });
  }

  async findByDeveloperId(
    developerId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<DeveloperPayout>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    
    const findOptions: FindManyOptions<DeveloperPayout> = {
      where: { developerId },
      skip,
      take: limit,
      relations: ['commissions'],
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { payoutDate: 'DESC' };
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

  async save(payout: DeveloperPayout): Promise<DeveloperPayout> {
    return this.repo.save(payout);
  }
}
```