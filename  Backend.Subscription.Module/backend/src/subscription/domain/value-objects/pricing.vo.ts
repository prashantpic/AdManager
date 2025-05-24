import { BillingCycle } from '../../common/enums/billing-cycle.enum';

export class PricingVO {
  public readonly amount: number;
  public readonly currency: string;
  public readonly cycle: BillingCycle;

  constructor(amount: number, currency: string, cycle: BillingCycle) {
    if (amount < 0) {
      throw new Error('Pricing amount cannot be negative.');
    }
    if (!currency || currency.trim() === '') {
      throw new Error('Currency cannot be empty.');
    }
    if (!Object.values(BillingCycle).includes(cycle)) {
      throw new Error('Invalid billing cycle provided.');
    }

    this.amount = amount;
    this.currency = currency.toUpperCase(); // Standardize currency
    this.cycle = cycle;
    Object.freeze(this); // Make immutable
  }

  public equals(other?: PricingVO): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor.name !== this.constructor.name) {
        return false;
    }
    return (
      this.amount === other.amount &&
      this.currency === other.currency &&
      this.cycle === other.cycle
    );
  }
}