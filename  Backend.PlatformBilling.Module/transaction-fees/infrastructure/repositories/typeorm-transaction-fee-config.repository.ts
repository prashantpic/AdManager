```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { TransactionFeeConfig } from '../../domain/entities/transaction-fee-config.entity';
import { ITransactionFeeConfigRepository } from '../../domain/repositories/transaction-fee-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class TypeOrmTransactionFeeConfigRepository implements ITransactionFeeConfigRepository {
  constructor(
    @InjectRepository(TransactionFeeConfig)
    private readonly repo: Repository<TransactionFeeConfig>,
  ) {}

  async findById(id: string): Promise<TransactionFeeConfig | null> {
    return this.repo.findOneBy({ id });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<TransactionFeeConfig>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<TransactionFeeConfig> = {
      skip,
      take: limit,
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' }; // Default sortOrder
    } else {
      findOptions.order = { createdAt: 'DESC' }; // Default sort
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

  async save(config: TransactionFeeConfig): Promise<TransactionFeeConfig> {
    return this.repo.save(config);
  }

  async findActiveBySubscriptionPlanAndCurrency(
    subscriptionPlanId: string,
    currency: string,
  ): Promise<TransactionFeeConfig | null> {
    // This query logic assumes that if applicableSubscriptionPlanIds is NULL, it applies to all plans.
    // If it must contain the specific planId, the query needs to be more specific.
    // For an array contains query, a QueryBuilder or Raw SQL might be more robust depending on DB specifics.
    // Using a simpler approach first: find configs that are active, match currency, and either have no specific plans or include the given plan.

    const queryBuilder = this.repo.createQueryBuilder('config');
    queryBuilder
      .where('config.isActive = :isActive', { isActive: true })
      .andWhere('config.currency = :currency', { currency })
      .andWhere(
        '(config.applicableSubscriptionPlanIds IS NULL OR :subscriptionPlanId = ANY(config.applicableSubscriptionPlanIds))',
        { subscriptionPlanId },
      )
      .orderBy('config.applicableSubscriptionPlanIds', 'DESC NULLS LAST') // Prioritize specific plan matches over NULL (applies to all)
      .addOrderBy('config.createdAt', 'DESC'); // Or by specificity / creation date

    return queryBuilder.getOne();
  }
}
```