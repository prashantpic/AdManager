```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CalculatedAppCommission } from '../../domain/entities/calculated-app-commission.entity';
import { ICalculatedAppCommissionRepository } from '../../domain/repositories/calculated-app-commission.repository.interface';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { CommissionQueryDto } from '../../application/dto/commission-query.dto';
import { CommissionStatus } from '../../../common/enums/commission-status.enum';

@Injectable()
export class TypeOrmCalculatedAppCommissionRepository implements ICalculatedAppCommissionRepository {
  constructor(
    @InjectRepository(CalculatedAppCommission)
    private readonly repo: Repository<CalculatedAppCommission>,
  ) {}

  async findById(id: string): Promise<CalculatedAppCommission | null> {
    return this.repo.findOne({ 
        where: { id },
        relations: ['appCommissionConfig', 'developerPayout']
    });
  }

  async findByAppSaleTransactionId(transactionId: string): Promise<CalculatedAppCommission | null> {
    return this.repo.findOne({
      where: { appSaleTransactionId: transactionId },
      relations: ['appCommissionConfig', 'developerPayout'],
    });
  }

  async findByDeveloperId(
    developerId: string,
    query: CommissionQueryDto,
  ): Promise<PaginatedResponseDto<CalculatedAppCommission>> {
    const { page = 1, limit = 10, sortBy, sortOrder, status, appId, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<CalculatedAppCommission> = {
      skip,
      take: limit,
      relations: ['appCommissionConfig', 'developerPayout'],
    };

    if (sortBy && sortOrder) {
      findOptions.order = { [sortBy]: sortOrder };
    } else if (sortBy) {
      findOptions.order = { [sortBy]: 'DESC' };
    } else {
      findOptions.order = { calculatedAt: 'DESC' };
    }

    const where: FindOptionsWhere<CalculatedAppCommission> = { developerId };
    if (status) {
      where.status = status;
    }
    if (appId) {
      where.appId = appId;
    }

    if (dateFrom && dateTo) {
      where.calculatedAt = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.calculatedAt = MoreThanOrEqual(new Date(dateFrom));
    } else if (dateTo) {
      where.calculatedAt = LessThanOrEqual(new Date(dateTo));
    }
    
    findOptions.where = where;

    const [entities, total] = await this.repo.findAndCount(findOptions);

    return {
      data: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(commission: CalculatedAppCommission): Promise<CalculatedAppCommission> {
    return this.repo.save(commission);
  }

  async saveMany(commissions: CalculatedAppCommission[]): Promise<CalculatedAppCommission[]> {
    return this.repo.save(commissions);
  }
}
```