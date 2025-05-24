import { v4 as uuidv4 } from 'uuid';
import { LineItem, LineItemData } from './line-item.entity';
import { CustomerInformation, CustomerInformationData } from './customer-information.value-object';
import { ShippingInformation, ShippingInformationData, ShippingAddressData } from './shipping-information.value-object';
import { AppliedPromotion, AppliedPromotionData } from './applied-promotion.value-object';
import { GiftOption, GiftOptionData } from './gift-option.value-object';
import { OrderStatus } from '../../enums/order-status.enum';
import { InvalidOrderStateException } from '../../exceptions/invalid-order-state.exception';
import { OrderPlacedEvent } from '../../events/order-placed.event';
import { OrderStatusChangedEvent } from '../../events/order-status-changed.event';

// BaseAggregateRoot would handle domain events if using a more formal DDD framework
// export abstract class BaseAggregateRoot<TId = string> {
//   protected readonly _id: TId;
//   private _domainEvents: any[] = []; // Replace 'any' with a base DomainEvent type

//   protected constructor(id: TId) {
//     this._id = id;
//   }

//   public get id(): TId { return this._id; }

//   protected addDomainEvent(domainEvent: any): void {
//     this._domainEvents.push(domainEvent);
//   }

//   public getUncommittedEvents(): any[] {
//     return [...this._domainEvents];
//   }

//   public markEventsAsCommitted(): void {
//     this._domainEvents = [];
//   }
// }


export interface CreateOrderData {
  merchantId: string;
  customerId?: string;
  items: LineItemData[]; // Raw item data, product details (name, price) to be filled by app service
  customerDetails: CustomerInformationData;
  shippingAddress: ShippingAddressData; // Raw address data for ShippingInformation VO
  promotionCodes?: string[]; // Codes to be validated
  giftOptions?: GiftOptionData; // Order-level
  status: OrderStatus; // Initial status
  currency: string;
  // Total amount and shipping cost are typically calculated by services/VOs
}

export class OrderAggregate { // extends BaseAggregateRoot<string>
  private _id: string;
  private _merchantId: string;
  private _customerId?: string;
  private _lineItems: LineItem[];
  private _customerInformation: CustomerInformation;
  private _shippingInformation: ShippingInformation; // Includes address, method, and cost
  private _appliedPromotions: AppliedPromotion[];
  private _giftOption?: GiftOption;
  private _status: OrderStatus;
  private _totalAmount: number;
  private _currency: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  // For domain event handling if not using a base class
  private _domainEvents: (OrderPlacedEvent | OrderStatusChangedEvent)[] = [];

  private constructor(
    id: string,
    merchantId: string,
    lineItems: LineItem[],
    customerInformation: CustomerInformation,
    shippingInformation: ShippingInformation,
    status: OrderStatus,
    totalAmount: number,
    currency: string,
    createdAt: Date,
    updatedAt: Date,
    customerId?: string,
    appliedPromotions?: AppliedPromotion[],
    giftOption?: GiftOption,
  ) {
    // super(id);
    this._id = id;
    this._merchantId = merchantId;
    this._customerId = customerId;
    this._lineItems = lineItems;
    this._customerInformation = customerInformation;
    this._shippingInformation = shippingInformation;
    this._appliedPromotions = appliedPromotions || [];
    this._giftOption = giftOption;
    this._status = status;
    this._totalAmount = totalAmount;
    this._currency = currency;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public static create(data: CreateOrderData): OrderAggregate {
    const orderId = uuidv4();
    const now = new Date();

    const lineItems = data.items.map(itemData => new LineItem(itemData)); // Assumes itemData has productName & unitPrice from app service
    const customerInfo = new CustomerInformation(data.customerDetails);
    // Shipping cost will be set later by CheckoutService after calculation via ShippingProvider
    const shippingInfo = new ShippingInformation(data.shippingAddress, 'TBD', 0);

    // Initial total, will be finalized by OrderCalculationService
    const subTotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = new OrderAggregate(
      orderId,
      data.merchantId,
      lineItems,
      customerInfo,
      shippingInfo,
      data.status,
      subTotal, // Initial subtotal, promotions & shipping cost applied later
      data.currency,
      now,
      now,
      data.customerId,
      [], // Promotions applied later
      data.giftOptions ? new GiftOption(data.giftOptions) : undefined,
    );

    // Order creation implies it's "placed" or "initialized"
    // For this SDS, OrderPlacedEvent is emitted by OrderService after successful persistence
    // If emitting from aggregate: order.addDomainEvent(new OrderPlacedEvent(order.id, order.merchantId));
    return order;
  }

  // Used by repository to reconstruct aggregate from persisted state
  public static rehydrate(
    id: string,
    merchantId: string,
    lineItems: LineItem[],
    customerInformation: CustomerInformation,
    shippingInformation: ShippingInformation,
    status: OrderStatus,
    totalAmount: number,
    currency: string,
    createdAt: Date,
    updatedAt: Date,
    customerId?: string,
    appliedPromotions?: AppliedPromotion[],
    giftOption?: GiftOption,
  ): OrderAggregate {
    return new OrderAggregate(
      id, merchantId, lineItems, customerInformation, shippingInformation,
      status, totalAmount, currency, createdAt, updatedAt,
      customerId, appliedPromotions, giftOption
    );
  }

  // Getters
  get id(): string { return this._id; }
  get merchantId(): string { return this._merchantId; }
  get customerId(): string | undefined { return this._customerId; }
  get lineItems(): ReadonlyArray<LineItem> { return [...this._lineItems]; } // Return copy
  get customerInformation(): CustomerInformation { return this._customerInformation; }
  get shippingInformation(): ShippingInformation { return this._shippingInformation; }
  get appliedPromotions(): ReadonlyArray<AppliedPromotion> { return [...this._appliedPromotions]; }
  get giftOption(): GiftOption | undefined { return this._giftOption; }
  get status(): OrderStatus { return this._status; }
  get totalAmount(): number { return this._totalAmount; }
  get currency(): string { return this._currency; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public getUncommittedEvents(): (OrderPlacedEvent | OrderStatusChangedEvent)[] {
    return [...this._domainEvents];
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  protected addDomainEvent(event: OrderPlacedEvent | OrderStatusChangedEvent): void {
    this._domainEvents.push(event);
  }


  // Business Logic Methods
  public addLineItem(itemData: LineItemData): void {
    if (this._status !== OrderStatus.PENDING_PAYMENT && this.status !== OrderStatus.PROCESSING) { // Check other mutable states
      throw new InvalidOrderStateException(`Cannot add items to order in status ${this._status}.`);
    }
    const newLineItem = new LineItem(itemData);
    this._lineItems.push(newLineItem);
    this.recalculateAndUpdateTotal(); // Total needs recalculation
    this._updatedAt = new Date();
  }

  public applyPromotion(promoData: AppliedPromotionData): void {
    if (this._status !== OrderStatus.PENDING_PAYMENT) { // Check other mutable states
      throw new InvalidOrderStateException(`Cannot apply promotions to order in status ${this._status}.`);
    }
    const existingPromo = this._appliedPromotions.find(p => p.promotionId === promoData.promotionId || (promoData.code && p.code === promoData.code));
    if (existingPromo) {
        // Handle re-application or stacking rules if necessary, or throw error
        console.warn(`Promotion ${promoData.promotionId || promoData.code} already applied. Skipping.`);
        return;
    }
    this._appliedPromotions.push(new AppliedPromotion(promoData));
    this.recalculateAndUpdateTotal(); // Total needs recalculation
    this._updatedAt = new Date();
  }

  public updateStatus(newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.AWAITING_SHIPMENT, OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.FAILED],
      [OrderStatus.AWAITING_SHIPMENT]: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.AWAITING_SHIPMENT, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.FAILED], // FAILED for returns/loss
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [], // Terminal state
      [OrderStatus.FAILED]: [OrderStatus.CANCELLED], // Can be cancelled after failure
    };

    if (!validTransitions[this._status]?.includes(newStatus)) {
      throw new InvalidOrderStateException(`Cannot transition order from ${this._status} to ${newStatus}.`);
    }
    const oldStatus = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();
    this.addDomainEvent(new OrderStatusChangedEvent(this.id, oldStatus, newStatus));
  }

  public setGiftOptions(options: GiftOptionData): void {
    if (this._status !== OrderStatus.PENDING_PAYMENT && this.status !== OrderStatus.PROCESSING) {
        throw new InvalidOrderStateException(`Cannot set gift options for order in status ${this._status}.`);
    }
    this._giftOption = new GiftOption(options);
    this._updatedAt = new Date();
  }

  public updateShippingDetails(method: string, cost: number, addressData?: ShippingAddressData): void {
    // Address can be updated if shipping destination changes, or method/cost updated after selection
    const newAddress = addressData ? new ShippingAddressValueObject(addressData) : this._shippingInformation.address;
    this._shippingInformation = new ShippingInformation(newAddress.props, method, cost);
    this.recalculateAndUpdateTotal(); // Total needs recalculation if shipping cost changes
    this._updatedAt = new Date();
  }

  /**
   * This method is called internally or by OrderCalculationService to update the aggregate's total.
   * The actual calculation logic (subtotal + shipping - discounts + taxes) is complex and delegated.
   */
  public setCalculatedTotal(finalTotal: number): void {
    if (finalTotal < 0) {
        throw new Error("Order total cannot be negative."); // Or specific domain exception
    }
    this._totalAmount = finalTotal;
    this._updatedAt = new Date();
  }

  private recalculateAndUpdateTotal(): void {
    // This is a simplified internal recalculation.
    // For complex scenarios, OrderCalculationService should be invoked by the Application Service
    // which then calls `setCalculatedTotal` on the aggregate.
    let newTotal = this._lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    newTotal += this._shippingInformation.cost;
    newTotal -= this._appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0);
    // Add taxes if applicable
    this._totalAmount = Math.max(0, newTotal); // Ensure total isn't negative
  }
}