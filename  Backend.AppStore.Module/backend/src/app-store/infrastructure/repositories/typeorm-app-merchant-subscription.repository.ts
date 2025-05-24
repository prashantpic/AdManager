import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppMerchantSubscriptionEntity, IAppMerchantSubscriptionRepository } from '../../domain';

@Injectable()
export class TypeOrmAppMerchantSubscriptionRepository implements IAppMerchantSubscriptionRepository {
  constructor(
    @InjectRepository(AppMerchantSubscriptionEntity)
    private readonly subscriptionOrmRepository: Repository<AppMerchantSubscriptionEntity>,
  ) {}

  async findById(id: string): Promise<AppMerchantSubscriptionEntity | null> {
    return this.subscriptionOrmRepository.findOne({ where: { id }, relations: ['app', 'installation'] });
  }
  
  async findByIdAndMerchantId(id: string, merchantId: string): Promise<AppMerchantSubscriptionEntity | null> {
    return this.subscriptionOrmRepository.findOne({ where: { id, merchantId }, relations: ['app', 'installation'] });
  }

  async findByMerchantId(merchantId: string): Promise<AppMerchantSubscriptionEntity[]> {
    return this.subscriptionOrmRepository.find({ where: { merchantId }, relations: ['app', 'installation'], order: { startDate: 'DESC' } });
  }

  async findActiveByMerchantAndAppId(merchantId: string, appId: string): Promise<AppMerchantSubscriptionEntity | null> {
    return this.subscriptionOrmRepository.findOne({
      where: { merchantId, appId, status: 'active' }, // Assuming 'active' is a valid status
      relations: ['app', 'installation'],
    });
  }
  
  async findActiveByInstallationId(installationId: string): Promise<AppMerchantSubscriptionEntity | null> {
    return this.subscriptionOrmRepository.findOne({
      where: { installationId, status: 'active' }, // Assuming 'active' is a valid status
      relations: ['app', 'installation'],
    });
  }
  
  async findByExternalSubscriptionId(externalSubscriptionId: string): Promise<AppMerchantSubscriptionEntity | null> {
      return this.subscriptionOrmRepository.findOne({
          where: { externalSubscriptionId },
          relations: ['app', 'installation']
      });
  }


  async save(subscription: AppMerchantSubscriptionEntity): Promise<AppMerchantSubscriptionEntity> {
    return this.subscriptionOrmRepository.save(subscription);
  }

  async delete(id: string): Promise<void> {
    // Subscriptions are typically cancelled (status change) rather than hard deleted
    const sub = await this.findById(id);
    if (sub) {
        sub.status = 'cancelled'; // Example status
        sub.endDate = new Date();
        await this.save(sub);
    }
  }
}