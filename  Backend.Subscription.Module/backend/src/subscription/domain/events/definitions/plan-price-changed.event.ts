import { PricingVO } from '../../value-objects/pricing.vo';
import { PLAN_PRICE_CHANGED_EVENT } from '../../../constants';

export class PlanPriceChangedEvent {
  public readonly eventName: string = PLAN_PRICE_CHANGED_EVENT;
  public readonly occurredAt: Date;

  constructor(
    public readonly planId: string,
    public readonly oldPricing: ReadonlyArray<PricingVO>, // Ensure VOs are treated as readonly
    public readonly newPricing: ReadonlyArray<PricingVO>,
  ) {
    this.occurredAt = new Date();
  }
}