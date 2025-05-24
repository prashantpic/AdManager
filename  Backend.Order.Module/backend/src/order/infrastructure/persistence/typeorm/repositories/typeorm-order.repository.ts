import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { IOrderRepository } from '../../../domain/interfaces/order.repository.interface';
import { OrderAggregate } from '../../../domain/aggregates/order/order.aggregate';
import { OrderTypeOrmEntity } from '../entities/order.typeorm-entity';
import { TypeOrmOrderMapper } from '../mappers/typeorm-order.mapper';

/**
 * TypeORM implementation of the order repository.
 * Provides concrete data access methods for Order aggregates using TypeORM and PostgreSQL.
 */
@Injectable()
export class TypeOrmOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderTypeOrmEntity)
    private readonly orderOrmRepository: TypeOrmRepository<OrderTypeOrmEntity>,
    private readonly typeOrmOrderMapper: TypeOrmOrderMapper,
  ) {}

  async save(order: OrderAggregate): Promise<OrderAggregate> {
    const orderEntity = this.typeOrmOrderMapper.toOrmEntity(order);
    const savedEntity = await this.orderOrmRepository.save(orderEntity);
    return this.typeOrmOrderMapper.toDomain(savedEntity);
  }

  async findById(orderId: string): Promise<OrderAggregate | null> {
    const orderEntity = await this.orderOrmRepository.findOne({
      where: { id: orderId },
      // Relations are eager-loaded in OrderTypeOrmEntity for lineItems
    });
    return orderEntity ? this.typeOrmOrderMapper.toDomain(orderEntity) : null;
  }

  async findByMerchantId(merchantId: string, paginationOptions?: any): Promise<OrderAggregate[]> {
    const { take = 10, skip = 0, order = { createdAt: 'DESC' } } = paginationOptions || {};
    const orderEntities = await this.orderOrmRepository.find({
      where: { merchantId },
      take,
      skip,
      order,
      // Relations are eager-loaded
    });
    return orderEntities.map(entity => this.typeOrmOrderMapper.toDomain(entity));
  }
}