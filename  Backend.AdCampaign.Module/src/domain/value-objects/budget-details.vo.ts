import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export type BudgetType = 'DAILY' | 'LIFETIME';
export type BudgetAllocationStrategy = 'STANDARD' | 'ACCELERATED';

export class BudgetDetails {
  public readonly amount: number;
  public readonly currency: string;
  public readonly type: BudgetType;
  public readonly allocationStrategy?: BudgetAllocationStrategy;

  constructor(
    amount: number,
    currency: string,
    type: BudgetType,
    allocationStrategy?: BudgetAllocationStrategy,
  ) {
    if (amount === null || amount === undefined || amount < 0) {
      throw new ArgumentInvalidException('Budget amount must be a non-negative number.');
    }
    if (!currency || currency.trim().length !== 3) {
      // Basic validation, could use a list of valid currency codes
      throw new ArgumentInvalidException('Budget currency must be a valid 3-letter ISO code.');
    }
    if (!type || (type !== 'DAILY' && type !== 'LIFETIME')) {
      throw new ArgumentInvalidException('Budget type must be either "DAILY" or "LIFETIME".');
    }
    if (allocationStrategy && (allocationStrategy !== 'STANDARD' && allocationStrategy !== 'ACCELERATED')) {
      throw new ArgumentInvalidException('Budget allocation strategy must be "STANDARD" or "ACCELERATED", if provided.');
    }

    this.amount = amount;
    this.currency = currency.toUpperCase();
    this.type = type;
    this.allocationStrategy = allocationStrategy;
  }

  // Getter methods can be added if direct property access is not preferred
}