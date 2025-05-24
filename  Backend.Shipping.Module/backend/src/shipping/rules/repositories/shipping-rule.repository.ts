import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ShippingRuleEntity } from '../entities/shipping-rule.entity';

@Injectable()
export class ShippingRuleRepository extends Repository<ShippingRuleEntity> {
  constructor(
    @InjectRepository(ShippingRuleEntity)
    private typeOrmRepository: Repository<ShippingRuleEntity>,
  ) {
    super(typeOrmRepository.target, typeOrmRepository.manager, typeOrmRepository.queryRunner);
  }

  async findByMerchantId(merchantId: string): Promise<ShippingRuleEntity[]> {
    return this.typeOrmRepository.find({
      where: { merchantId },
      order: { priority: 'ASC', name: 'ASC' }, // Sort by priority, then by name for consistent ordering
    });
  }

  async findActiveByMerchantId(merchantId: string): Promise<ShippingRuleEntity[]> {
    return this.typeOrmRepository.find({
      where: { merchantId, isActive: true },
      order: { priority: 'ASC', name: 'ASC' },
    });
  }

  async findByIdAndMerchantId(ruleId: string, merchantId: string): Promise<ShippingRuleEntity | null> {
    return this.typeOrmRepository.findOne({
      where: { id: ruleId, merchantId },
    });
  }

  // create() and save() are inherited from TypeORM Repository
  // delete() (by ID) and remove() (by entity) are inherited

  async createAndSave(
    merchantId: string,
    ruleData: Partial<Omit<ShippingRuleEntity, 'id' | 'merchantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<ShippingRuleEntity> {
    const newRule = this.typeOrmRepository.create({
      ...ruleData,
      merchantId,
    });
    return this.typeOrmRepository.save(newRule);
  }
}