```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotedListingBid } from '../../domain/entities/promoted-listing-bid.entity';
import { IPromotedListingBidRepository } from '../../domain/repositories/promoted-listing-bid.repository.interface';

@Injectable()
export class TypeOrmPromotedListingBidRepository implements IPromotedListingBidRepository {
  constructor(
    @InjectRepository(PromotedListingBid)
    private readonly repo: Repository<PromotedListingBid>,
  ) {}

  async save(bid: PromotedListingBid): Promise<PromotedListingBid> {
    return this.repo.save(bid);
  }

  // Additional methods like findByChargeId or findActiveBids could be added here if needed by services.
  // For now, only implementing the 'save' method as per the provided interface definition in SDS for IPromotedListingBidRepository.

  async findById(id: string): Promise<PromotedListingBid | null> {
    return this.repo.findOne({
        where: {id},
        relations: ['promotedListingCharge']
    });
  }
}
```