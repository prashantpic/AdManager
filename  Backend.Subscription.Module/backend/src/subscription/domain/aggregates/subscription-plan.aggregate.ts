import { PlanType } from '../../common/enums/plan-type.enum';
import { PricingVO } from '../value-objects/pricing.vo';
import { SubscriptionFeatureVO } from '../value-objects/subscription-feature.vo';
import { UsageLimitVO } from '../value-objects/usage-limit.vo';
import { PlanPriceChangedEvent } from '../events/definitions/plan-price-changed.event';
import { PLAN_PRICE_CHANGED_EVENT } from '../../constants';

// Assuming a simple AggregateRoot base class for event handling
abstract class BaseAggregateRoot {
  private _domainEvents: any[] = [];

  public get domainEvents(): any[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: any): void {
    this._domainEvents.push(domainEvent);
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}


export class SubscriptionPlanAggregate extends BaseAggregateRoot {
  public readonly id: string;
  private _name: string; // Use string as PlanNameVO not defined
  private _type: PlanType;
  private _pricingTiers: PricingVO[];
  private _features: SubscriptionFeatureVO[];
  private _usageLimits: UsageLimitVO[];
  private _supportLevel: string;

  private constructor(
    id: string,
    name: string,
    type: PlanType,
    pricingTiers: PricingVO[],
    features: SubscriptionFeatureVO[],
    usageLimits: UsageLimitVO[],
    supportLevel: string,
  ) {
    super();
    if (!id) throw new Error("SubscriptionPlan ID cannot be empty.");
    if (!name) throw new Error("SubscriptionPlan name cannot be empty.");
    if (!pricingTiers || pricingTiers.length === 0) {
        throw new Error("SubscriptionPlan must have at least one pricing tier.");
    }

    this.id = id;
    this._name = name;
    this._type = type;
    this._pricingTiers = [...pricingTiers]; // Defensive copy
    this._features = [...features];
    this._usageLimits = [...usageLimits];
    this._supportLevel = supportLevel;
  }

  public static create(props: {
    id: string;
    name: string; // Using string
    type: PlanType;
    pricingTiers: PricingVO[];
    features: SubscriptionFeatureVO[];
    usageLimits: UsageLimitVO[];
    supportLevel: string;
  }): SubscriptionPlanAggregate {
    // Additional validation for creation can go here
    const plan = new SubscriptionPlanAggregate(
      props.id,
      props.name,
      props.type,
      props.pricingTiers,
      props.features,
      props.usageLimits,
      props.supportLevel,
    );
    // Optionally, add a PlanCreatedEvent
    // plan.addDomainEvent(new PlanCreatedEvent(plan.id, plan.name));
    return plan;
  }

  public get name(): string { return this._name; }
  public get type(): PlanType { return this._type; }
  public get pricingTiers(): PricingVO[] { return [...this._pricingTiers]; } // Return copy
  public get features(): SubscriptionFeatureVO[] { return [...this._features]; }
  public get usageLimits(): UsageLimitVO[] { return [...this._usageLimits]; }
  public get supportLevel(): string { return this._supportLevel; }


  public updatePrice(newPricingTiers: PricingVO[]): void {
    if (!newPricingTiers || newPricingTiers.length === 0) {
      throw new Error('Cannot update price: New pricing tiers cannot be empty.');
    }
    // Deep comparison to check if pricing actually changed
    const oldPricingTiersCopy = [...this._pricingTiers];
    
    let changed = oldPricingTiersCopy.length !== newPricingTiers.length;
    if (!changed) {
        for (let i = 0; i < oldPricingTiersCopy.length; i++) {
            if (!oldPricingTiersCopy[i].equals(newPricingTiers[i])) {
                changed = true;
                break;
            }
        }
    }

    if (changed) {
        this._pricingTiers = [...newPricingTiers]; // Defensive copy
        this.addDomainEvent(
          new PlanPriceChangedEvent(this.id, oldPricingTiersCopy, this._pricingTiers),
        );
    }
  }

  public updateDetails(details: {
    name?: string;
    type?: PlanType;
    features?: SubscriptionFeatureVO[];
    usageLimits?: UsageLimitVO[];
    supportLevel?: string;
  }): void {
    let updated = false;
    if (details.name !== undefined && this._name !== details.name) {
      this._name = details.name;
      updated = true;
    }
    if (details.type !== undefined && this._type !== details.type) {
      this._type = details.type;
      updated = true;
    }
    if (details.features !== undefined) { // Deep comparison needed for arrays of VOs
      this._features = [...details.features];
      updated = true; // Simplified, assume change if provided
    }
    if (details.usageLimits !== undefined) {
      this._usageLimits = [...details.usageLimits];
      updated = true; // Simplified
    }
    if (details.supportLevel !== undefined && this._supportLevel !== details.supportLevel) {
      this._supportLevel = details.supportLevel;
      updated = true;
    }

    // if (updated) {
    //   this.addDomainEvent(new PlanDetailsUpdatedEvent(this.id)); // Example event
    // }
  }
}