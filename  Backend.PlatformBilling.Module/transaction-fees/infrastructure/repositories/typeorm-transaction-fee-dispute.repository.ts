```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { TransactionFeeDispute } from '../../domain/entities/transaction-fee-dispute.entity';
import { ITransactionFeeDisputeRepository } from '../../domain/repositories/transaction-fee-dispute.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';

@Injectable()
export class TypeOrmTransactionFeeDisputeRepository implements ITransactionFeeDisputeRepository {
  constructor(
    @InjectRepository(TransactionFeeDispute)
    private readonly repo: Repository<TransactionFeeDispute>,
  ) {}

  async findById(id: string): Promise<TransactionFeeDispute | null> {
    return this.repo.findOne({ 
        where: { id },
        relations: ['appliedFee', 'appliedFee.transactionFeeConfig'] 
    });
  }

  async findByMerchantId(
    merchantId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<TransactionFeeDispute> = {
      where: { merchantId },
      skip,
      take: limit,
      relations: ['appliedFee'],
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { submittedAt: 'DESC' };
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

  async findAllAdmin(query: PaginationQueryDto): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    const { page = 1, limit = 10, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

     const findOptions: FindManyOptions<TransactionFeeDispute> = {
      skip,
      take: limit,
      relations: ['appliedFee'],
    };
    
    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { submittedAt: 'DESC' };
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

  async save(dispute: TransactionFeeDispute): Promise<TransactionFeeDispute> {
    return this.repo.save(dispute);
  }
}
```