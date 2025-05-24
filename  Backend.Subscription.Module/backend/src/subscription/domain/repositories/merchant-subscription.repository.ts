import { MerchantSubscriptionAggregate } from '../aggregates/merchant-subscription.aggregate';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

export interface IMerchantSubscriptionRepository {
  findById(id: string): Promise<MerchantSubscriptionAggregate | null>;
  findByMerchantId(merchantId: string): Promise<MerchantSubscriptionAggregate | null>;
  save(subscription: MerchantSubscriptionAggregate): Promise<void>; // Handles create and update

  // For scheduled jobs
  findSubscriptionsDueForRenewal(renewalDate: Date): Promise<MerchantSubscriptionAggregate[]>;
  findSubscriptionsInDunning(
    statuses: SubscriptionStatus[],
    maxAttempts: number, // To filter out those that reached max attempts if job handles only retries
    retryIntervalHours: number, // To check if enough time has passed since last attempt
  ): Promise<MerchantSubscriptionAggregate[]>;
}

// Injection token for the repository interface
export const IMerchantSubscriptionRepositoryToken = Symbol('IMerchantSubscriptionRepository');