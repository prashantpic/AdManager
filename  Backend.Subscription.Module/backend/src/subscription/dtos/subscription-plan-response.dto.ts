import { PlanType } from '../common/enums/plan-type.enum';
import { PricingTierDto, FeatureDto, UsageLimitDto } from './create-subscription-plan.dto';

export class SubscriptionPlanResponseDto {
  id: string;
  name: string;
  type: PlanType;
  pricingTiers: PricingTierDto[];
  features: FeatureDto[];
  usageLimits: UsageLimitDto[];
  supportLevel: string;
}