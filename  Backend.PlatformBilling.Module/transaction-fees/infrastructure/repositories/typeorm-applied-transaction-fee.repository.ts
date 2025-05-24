```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppliedTransactionFee } from '../../domain/entities/applied-transaction-fee.entity';
import { IAppliedTransactionFeeRepository } from '../../domain/repositories/applied-transaction-fee.repository.interface';

@Injectable()
export class TypeOrmAppliedTransactionFeeRepository implements IAppliedTransactionFeeRepository {
  constructor(
    @InjectRepository(AppliedTransactionFee)
    private readonly repo: Repository<AppliedTransactionFee>,
  ) {}

  async findById(id: string): Promise<AppliedTransactionFee | null> {
    return this.repo.findOne({
        where: { id },
        relations: ['transactionFeeConfig', 'dispute'] 
    });
  }

  async save(appliedFee: AppliedTransactionFee): Promise<AppliedTransactionFee> {
    return this.repo.save(appliedFee);
  }

  async findUncollectedByMerchant(merchantId: string): Promise<AppliedTransactionFee[]> {
    return this.repo.find({
      where: {
        merchantId,
        status: 'PENDING_COLLECTION', // Assuming 'PENDING_COLLECTION' is a valid status string
      },
      relations: ['transactionFeeConfig'],
    });
  }
}
```