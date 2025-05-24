import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';
import { SubscriptionPlanAggregate } from '../domain/aggregates/subscription-plan.aggregate';
import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';
import { SubscriptionPlanMapper } from '../mappers/subscription-plan.mapper';
import { PlanNotFoundException } from '../common/exceptions/plan-not-found.exception';

@Injectable()
export class TypeOrmSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly ormRepository: Repository<SubscriptionPlanEntity>,
    private readonly mapper: SubscriptionPlanMapper,
  ) {}

  async findById(id: string): Promise<SubscriptionPlanAggregate | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findAll(): Promise<SubscriptionPlanAggregate[]> {
    const entities = await this.ormRepository.find();
    return entities.map(entity => this.mapper.toAggregate(entity));
  }

  async save(plan: SubscriptionPlanAggregate): Promise<void> {
    const entity = this.mapper.toEntity(plan);
    await this.ormRepository.save(entity); // TypeORM handles insert or update
  }

  async delete(id: string): Promise<void> {
    const result = await this.ormRepository.delete(id);
    if (result.affected === 0) {
      // It's debatable whether to throw here, as DELETE is often idempotent.
      // However, if the expectation is that it *must* exist, then throw.
      throw new PlanNotFoundException(id);
    }
  }
}