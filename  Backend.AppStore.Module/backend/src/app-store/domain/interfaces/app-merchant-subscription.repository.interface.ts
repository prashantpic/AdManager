import { AppMerchantSubscriptionEntity } from '../subscription/entities/app-merchant-subscription.entity';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';
import { PaginatedResult } from './app.repository.interface';

export interface IAppMerchantSubscriptionRepository {
  findById(id: string): Promise<AppMerchantSubscriptionEntity | null>;
  findByMerchantId(merchantId: string, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppMerchantSubscriptionEntity>>;
  findByInstallationId(installationId: string): Promise<AppMerchantSubscriptionEntity | null>;
  findActiveByMerchantAndAppId(
    merchantId: string,
    appId: string,
  ): Promise<AppMerchantSubscriptionEntity | null>;
  save(
    subscription: AppMerchantSubscriptionEntity,
  ): Promise<AppMerchantSubscriptionEntity>;
}