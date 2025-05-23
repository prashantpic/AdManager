import { BidStrategyType } from '../../constants/bid-strategy-type.enum';
import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export class BidStrategy {
  public readonly type: BidStrategyType;
  public readonly bidAmount?: number; // For MANUAL_CPC, MANUAL_CPM
  public readonly targetCpa?: number; // For TARGET_CPA
  public readonly targetRoas?: number; // For TARGET_ROAS (Return on Ad Spend, e.g., 3.5 for 350%)

  constructor(params: {
    type: BidStrategyType;
    bidAmount?: number;
    targetCpa?: number;
    targetRoas?: number;
  }) {
    if (!params.type || !Object.values(BidStrategyType).includes(params.type)) {
      throw new ArgumentInvalidException('Invalid bid strategy type.');
    }

    this.type = params.type;

    switch (params.type) {
      case BidStrategyType.MANUAL_CPC:
      case BidStrategyType.MANUAL_CPM:
        if (params.bidAmount === null || params.bidAmount === undefined || params.bidAmount <= 0) {
          throw new ArgumentInvalidException(`Bid amount is required and must be positive for ${params.type}.`);
        }
        this.bidAmount = params.bidAmount;
        break;
      case BidStrategyType.TARGET_CPA:
        if (params.targetCpa === null || params.targetCpa === undefined || params.targetCpa <= 0) {
          throw new ArgumentInvalidException(`Target CPA is required and must be positive for ${params.type}.`);
        }
        this.targetCpa = params.targetCpa;
        break;
      case BidStrategyType.TARGET_ROAS:
        if (params.targetRoas === null || params.targetRoas === undefined || params.targetRoas <= 0) {
          throw new ArgumentInvalidException(`Target ROAS is required and must be positive for ${params.type}.`);
        }
        this.targetRoas = params.targetRoas;
        break;
      case BidStrategyType.MAXIMIZE_CONVERSIONS:
      case BidStrategyType.MAXIMIZE_CLICKS:
      case BidStrategyType.AUTOMATED_BIDDING:
        // These might not require specific values, or they might have optional caps/targets
        // not covered by these specific fields.
        break;
      default:
        throw new ArgumentInvalidException(`Unhandled bid strategy type: ${params.type}`);
    }
  }
  // Getter methods can be added
}