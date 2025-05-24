export interface GiftOptionData {
    isGift: boolean;
    message?: string;
    recipientName?: string;
}

/**
 * Value object for gift options associated with an order or line item.
 * An immutable data structure capturing gift preferences.
 */
export class GiftOption {
    public readonly isGift: boolean;
    public readonly message?: string;
    public readonly recipientName?: string;

    constructor(data: GiftOptionData) {
        this.isGift = data.isGift;
        this.message = data.message;
        this.recipientName = data.recipientName;

        if (this.isGift && !this.recipientName && this.message) {
            // Example business rule: if it's a gift with a message, a recipient name might be expected
            // For now, keeping it simple based on provided properties.
        }
         if (!this.isGift && (this.message || this.recipientName)) {
            // throw new Error('Message and recipient name are only applicable if it is a gift.');
            // Or, clear them if isGift is false
            // This depends on desired strictness. Current properties allow this.
        }
    }

    public equals(other?: GiftOption): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return (
            this.isGift === other.isGift &&
            this.message === other.message &&
            this.recipientName === other.recipientName
        );
    }
}