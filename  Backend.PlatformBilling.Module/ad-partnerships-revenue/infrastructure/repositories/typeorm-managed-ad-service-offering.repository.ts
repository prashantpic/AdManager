```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedAdServiceOffering } from '../../domain/entities/managed-ad-service-offering.entity';
import { IManagedAdServiceOfferingRepository } from '../../domain/repositories/managed-ad-service-offering.repository.interface';

@Injectable()
export class TypeOrmManagedAdServiceOfferingRepository implements IManagedAdServiceOfferingRepository {
  constructor(
    @InjectRepository(ManagedAdServiceOffering)
    private readonly repo: Repository<ManagedAdServiceOffering>,
  ) {}

  async findById(id: string): Promise<ManagedAdServiceOffering | null> {
    return this.repo.findOneBy({ id });
  }

  async save(offering: ManagedAdServiceOffering): Promise<ManagedAdServiceOffering> {
    return this.repo.save(offering);
  }
  
  // findAll method could be added if needed.
  // For now, sticking to the interface methods specified.
}
```