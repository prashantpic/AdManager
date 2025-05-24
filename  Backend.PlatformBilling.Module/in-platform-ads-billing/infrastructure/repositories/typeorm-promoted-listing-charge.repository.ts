```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { PromotedListingCharge } from '../../domain/entities/promoted-listing-charge.entity';
import { IPromotedListingChargeRepository } from '../../domain/repositories/promoted-listing-charge.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class TypeOrmPromotedListingChargeRepository implements IPromotedListingChargeRepository {
  constructor(
    @InjectRepository(PromotedListingCharge)
    private readonly repo: Repository<PromotedListingCharge>,
  ) {}

  async findById(id: string): Promise<PromotedListingCharge | null> {
    return this.repo.findOne({
        where: {id},
        relations: ['promotedListingConfig']
    });
  }

  async findByMerchantId(
    merchantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PromotedListingCharge>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<PromotedListingCharge> = {
      where: { merchantId },
      skip,
      take: limit,
      relations: ['promotedListingConfig'],
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { usagePeriodStart: 'DESC' };
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

  async save(charge: PromotedListingCharge): Promise<PromotedListingCharge> {
    return this.repo.save(charge);
  }
}
```