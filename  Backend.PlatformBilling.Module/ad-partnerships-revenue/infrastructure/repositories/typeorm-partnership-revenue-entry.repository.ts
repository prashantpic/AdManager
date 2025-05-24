```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnershipRevenueEntry } from '../../domain/entities/partnership-revenue-entry.entity';
import { IPartnershipRevenueEntryRepository } from '../../domain/repositories/partnership-revenue-entry.repository.interface';

@Injectable()
export class TypeOrmPartnershipRevenueEntryRepository implements IPartnershipRevenueEntryRepository {
  constructor(
    @InjectRepository(PartnershipRevenueEntry)
    private readonly repo: Repository<PartnershipRevenueEntry>,
  ) {}

  async save(entry: PartnershipRevenueEntry): Promise<PartnershipRevenueEntry> {
    return this.repo.save(entry);
  }

  // Methods like findByAgreementId or findByPeriod could be added if needed.
  // For now, sticking to the interface methods specified.
   async findById(id: string): Promise<PartnershipRevenueEntry | null> {
    return this.repo.findOne({
        where: {id},
        relations: ['agreement']
    });
  }
}
```