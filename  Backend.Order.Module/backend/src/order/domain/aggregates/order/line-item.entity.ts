import { v4 as uuidv4 } from 'uuid';
import { GiftOption, GiftOptionData } from './gift-option.value-object';

export interface LineItemData {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    giftOption?: GiftOptionData;
}

/**
 * Domain entity for an order line item.
 * Represents a single line in an order. Its lifecycle is managed by the OrderAggregate.
 */
export class LineItem {
    private readonly _id: string;
    private _productId: string;
    private _productName: string;
    private _quantity: number;
    private _unitPrice: number;
    private _totalPrice: number;
    private _giftOption?: GiftOption;

    constructor(data: LineItemData) {
        this._id = uuidv4();
        this._productId = data.productId;
        this._productName = data.productName;

        if (data.quantity <= 0) {
            throw new Error('Line item quantity must be positive.'); // Consider specific DomainException
        }
        this._quantity = data.quantity;

        if (data.unitPrice < 0) {
            throw new Error('Line item unit price cannot be negative.'); // Consider specific DomainException
        }
        this._unitPrice = data.unitPrice;
        this._totalPrice = this._unitPrice * this._quantity;
        this._giftOption = data.giftOption ? new GiftOption(data.giftOption) : undefined;
    }

    get id(): string { return this._id; }
    get productId(): string { return this._productId; }
    get productName(): string { return this._productName; }
    get quantity(): number { return this._quantity; }
    get unitPrice(): number { return this._unitPrice; }
    get totalPrice(): number { return this._totalPrice; }
    get giftOption(): GiftOption | undefined { return this._giftOption; }

    /**
     * Updates the quantity of the line item and recalculates its total price.
     * @param newQuantity The new quantity. Must be greater than 0.
     */
    public updateQuantity(newQuantity: number): void {
        if (newQuantity <= 0) {
            throw new Error('Line item quantity must be positive.'); // Consider specific DomainException
        }
        this._quantity = newQuantity;
        this._totalPrice = this._unitPrice * this._quantity;
    }

    /**
     * Sets or updates the gift options for this line item.
     * @param options The gift option data.
     */
    public setGiftOption(options: GiftOptionData): void {
        this._giftOption = new GiftOption(options);
    }

    /**
     * Clears the gift options for this line item.
     */
    public clearGiftOption(): void {
        this._giftOption = undefined;
    }
}