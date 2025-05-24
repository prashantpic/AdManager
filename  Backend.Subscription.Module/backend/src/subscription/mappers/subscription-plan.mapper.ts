import { Injectable } from '@nestjs/common';
import { SubscriptionPlanAggregate } from '../domain/aggregates/subscription-plan.aggregate';
import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';
import { SubscriptionPlanResponseDto } from '../dtos/subscription-plan-response.dto';
import { PricingVO } from '../domain/value-objects/pricing.vo';
import { SubscriptionFeatureVO } from '../domain/value-objects/subscription-feature.vo';
import { UsageLimitVO } from '../domain/value-objects/usage-limit.vo';
import { PlanType } from '../common/enums/plan-type.enum';
import { BillingCycle } from '../common/enums/billing-cycle.enum';

@Injectable()
export class SubscriptionPlanMapper {
  toDto(aggregate: SubscriptionPlanAggregate): SubscriptionPlanResponseDto {
    return {
      id: aggregate.id,
      name: aggregate.name,
      type: aggregate.type,
      pricingTiers: aggregate.pricingTiers.map(p => ({
        amount: p.amount,
        currency: p.currency,
        cycle: p.cycle,
      })),
      features: aggregate.features.map(f => ({
        name: f.name,
        description: f.description,
      })),
      usageLimits: aggregate.usageLimits.map(u => ({
        featureKey: u.featureKey,
        limit: u.limit,
        unit: u.unit,
      })),
      supportLevel: aggregate.supportLevel,
    };
  }

  toEntity(aggregate: SubscriptionPlanAggregate): SubscriptionPlanEntity {
    const entity = new SubscriptionPlanEntity();
    entity.id = aggregate.id;
    entity.name = aggregate.name;
    entity.type = aggregate.type;
    // Ensure VOs are stringified correctly
    entity.pricingTiersJson = JSON.stringify(aggregate.pricingTiers.map(p => ({ amount: p.amount, currency: p.currency, cycle: p.cycle })));
    entity.featuresJson = JSON.stringify(aggregate.features.map(f => ({ name: f.name, description: f.description })));
    entity.usageLimitsJson = JSON.stringify(aggregate.usageLimits.map(u => ({ featureKey: u.featureKey, limit: u.limit, unit: u.unit })));
    entity.supportLevel = aggregate.supportLevel;
    return entity;
  }

  toAggregate(entity: SubscriptionPlanEntity): SubscriptionPlanAggregate {
    const pricingTiers: PricingVO[] = JSON.parse(entity.pricingTiersJson).map(
      (p: any) => new PricingVO(p.amount, p.currency, p.cycle as BillingCycle),
    );
    const features: SubscriptionFeatureVO[] = JSON.parse(entity.featuresJson).map(
      (f: any) => new SubscriptionFeatureVO(f.name, f.description),
    );
    const usageLimits: UsageLimitVO[] = JSON.parse(entity.usageLimitsJson).map(
      (u: any) => new UsageLimitVO(u.featureKey, u.limit, u.unit),
    );

    return SubscriptionPlanAggregate.rehydrate(entity.id, entity.name, entity.type, pricingTiers, features, usageLimits, entity.supportLevel);
  }
}