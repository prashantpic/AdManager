```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdPartnershipAgreement } from '../../domain/entities/ad-partnership-agreement.entity';
import { IAdPartnershipAgreementRepository } from '../../domain/repositories/ad-partnership-agreement.repository.interface';

@Injectable()
export class TypeOrmAdPartnershipAgreementRepository implements IAdPartnershipAgreementRepository {
  constructor(
    @InjectRepository(AdPartnershipAgreement)
    private readonly repo: Repository<AdPartnershipAgreement>,
  ) {}

  async findById(id: string): Promise<AdPartnershipAgreement | null> {
    return this.repo.findOneBy({ id });
  }

  async save(agreement: AdPartnershipAgreement): Promise<AdPartnershipAgreement> {
    return this.repo.save(agreement);
  }

  // findAll method could be added if needed, similar to other config repositories.
  // For now, sticking to the interface methods specified.
}
```