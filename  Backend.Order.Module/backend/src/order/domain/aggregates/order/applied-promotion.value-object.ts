export interface AppliedPromotionData {
    promotionId: string;
    code?: string;
    description: string;
    discountAmount: number;
}

/**
 * Value object representing a promotion applied to an order.
 * An immutable data structure holding information about a successfully applied promotion.
 */
export class AppliedPromotion {
    public readonly promotionId: string;
    public readonly code?: string;
    public readonly description: string;
    public readonly discountAmount: number;

    constructor(data: AppliedPromotionData) {
        if (!data.promotionId) {
            throw new Error('Promotion ID is required for an applied promotion.'); // Consider specific DomainException
        }
        if (!data.description) {
            throw new Error('Description is required for an applied promotion.'); // Consider specific DomainException
        }
        if (data.discountAmount < 0) {
            // Allow 0 discount if a promotion has other benefits (e.g. free item not reflected in amount)
            throw new Error('Discount amount cannot be negative.'); // Consider specific DomainException
        }

        this.promotionId = data.promotionId;
        this.code = data.code;
        this.description = data.description;
        this.discountAmount = data.discountAmount;
    }

    public equals(other?: AppliedPromotion): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return (
            this.promotionId === other.promotionId &&
            this.code === other.code &&
            this.description === other.description &&
            this.discountAmount === other.discountAmount
        );
    }
}