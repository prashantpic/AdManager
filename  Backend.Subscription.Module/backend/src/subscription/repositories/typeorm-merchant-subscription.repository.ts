import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { IMerchantSubscriptionRepository } from '../domain/repositories/merchant-subscription.repository';
import { MerchantSubscriptionAggregate } from '../domain/aggregates/merchant-subscription.aggregate';
import { MerchantSubscriptionEntity } from '../entities/merchant-subscription.entity';
import { MerchantSubscriptionMapper } from '../mappers/merchant-subscription.mapper';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';

@Injectable()
export class TypeOrmMerchantSubscriptionRepository implements IMerchantSubscriptionRepository {
  constructor(
    @InjectRepository(MerchantSubscriptionEntity)
    private readonly ormRepository: Repository<MerchantSubscriptionEntity>,
    private readonly mapper: MerchantSubscriptionMapper,
  ) {}

  async findById(id: string): Promise<MerchantSubscriptionAggregate | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByMerchantId(merchantId: string): Promise<MerchantSubscriptionAggregate | null> {
    // Assuming a merchant can only have one non-terminated subscription at a time.
    // If multiple (e.g., past ones) can exist, query might need adjustment or service layer filtering.
    const entity = await this.ormRepository.findOne({
      where: { merchantId },
      // Optionally order by creation date if multiple are possible and you want the latest non-terminated one.
      // order: { createdAt: 'DESC' }
    });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async save(subscription: MerchantSubscriptionAggregate): Promise<void> {
    const entity = this.mapper.toEntity(subscription);
    await this.ormRepository.save(entity); // TypeORM handles insert or update
  }

  // findSubscriptionsDueForRenewal and findSubscriptionsInDunning methods can be added here
  // Example:
  // async findSubscriptionsDueForRenewal(date: Date): Promise<MerchantSubscriptionAggregate[]> {
  //   const entities = await this.ormRepository.find({
  //     where: {
  //       currentPeriodEnd: LessThanOrEqual(date),
  //       status: SubscriptionStatus.ACTIVE, // Or include PAST_DUE if retries apply to renewals
  //     },
  //   });
  //   return entities.map(entity => this.mapper.toAggregate(entity));
  // }

  // async findSubscriptionsInDunning(date: Date, config: any /* DunningConfig */): Promise<MerchantSubscriptionAggregate[]> {
  //   // Query logic for subscriptions in PAST_DUE or SUSPENDED states
  //   // that are ready for the next dunning action based on lastPaymentAttempt and dunningAttempts.
  //   // This can get complex and might involve date arithmetic in the query.
  //   const entities = await this.ormRepository.find({
  //     where: [
  //       { status: SubscriptionStatus.PAST_DUE },
  //       { status: SubscriptionStatus.SUSPENDED }, // if suspended subscriptions can also be retried/terminated by dunning job
  //     ],
  //     // Additional criteria based on dunningAttempts and lastPaymentAttempt would go here
  //   });
  //   return entities.map(entity => this.mapper.toAggregate(entity));
  // }
}