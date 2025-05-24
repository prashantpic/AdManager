import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShippingRuleRepository } from '../repositories/shipping-rule.repository';
import { CreateShippingRuleDto } from '../dto/create-shipping-rule.dto';
import { UpdateShippingRuleDto } from '../dto/update-shipping-rule.dto';
import { ShippingRuleEntity } from '../entities/shipping-rule.entity';
import { ShippingRuleNotFoundError } from '../../common/errors/shipping.errors';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ShippingRuleService {
  constructor(
    // TypeORM's standard Repository<ShippingRuleEntity> can be injected directly
    // if custom methods in ShippingRuleRepository are not extensive or specific.
    // Using the custom repository for consistency with the design.
    @InjectRepository(ShippingRuleEntity)
    private readonly shippingRuleRepository: ShippingRuleRepository,
  ) {}

  async createRule(
    merchantId: string,
    createDto: CreateShippingRuleDto,
  ): Promise<ShippingRuleEntity> {
    // Ensure DTO structure matches entity expectations for conditions/action
    // class-transformer's plainToInstance can help if DTOs are classes with decorators
    const ruleEntity = this.shippingRuleRepository.create({
      ...createDto,
      merchantId,
      // TypeORM handles JSONB conversion if conditions/action are plain objects matching interfaces
      conditions: createDto.conditions,
      action: createDto.action,
    });
    return this.shippingRuleRepository.save(ruleEntity);
  }

  async getRuleById(merchantId: string, ruleId: string): Promise<ShippingRuleEntity> {
    const rule = await this.shippingRuleRepository.findOne({
      where: { id: ruleId, merchantId },
    });
    if (!rule) {
      throw new ShippingRuleNotFoundError(ruleId);
    }
    return rule;
  }

  async updateRule(
    merchantId: string,
    ruleId: string,
    updateDto: UpdateShippingRuleDto,
  ): Promise<ShippingRuleEntity> {
    const rule = await this.getRuleById(merchantId, ruleId); // Leverages existing check and NotFoundError

    // Merge updates into the existing entity
    // TypeORM's save method can handle partial updates if the entity is loaded first
    // Or use `preload` then `save`
    const updatedRuleData = plainToInstance(ShippingRuleEntity, {
        ...rule, // existing data
        ...updateDto, // apply updates
    });

    // Retain the original ID
    updatedRuleData.id = rule.id;

    return this.shippingRuleRepository.save(updatedRuleData);
  }

  async deleteRule(merchantId: string, ruleId: string): Promise<void> {
    const rule = await this.getRuleById(merchantId, ruleId); // Leverages existing check
    await this.shippingRuleRepository.remove(rule);
  }

  async listRulesByMerchant(merchantId: string): Promise<ShippingRuleEntity[]> {
    return this.shippingRuleRepository.find({
      where: { merchantId },
      order: { priority: 'ASC', createdAt: 'DESC' }, // Example ordering
    });
  }
}