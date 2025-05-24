import { SubscriptionPlanAggregate } from '../aggregates/subscription-plan.aggregate';

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlanAggregate | null>;
  findAll(): Promise<SubscriptionPlanAggregate[]>;
  save(plan: SubscriptionPlanAggregate): Promise<void>; // Handles create and update
  delete(id: string): Promise<void>;
}

// Injection token for the repository interface
export const ISubscriptionPlanRepositoryToken = Symbol('ISubscriptionPlanRepository');