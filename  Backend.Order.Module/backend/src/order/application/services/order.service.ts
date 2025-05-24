import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto, OrderItemDto as CreateOrderItemDto, CustomerDetailsDto as CreateCustomerDetailsDto, ShippingAddressDto as CreateShippingAddressDto, GiftOptionsDto as CreateGiftOptionsDto } from '../dtos/create-order.dto';
import { OrderAggregate, CreateOrderData } from '../../domain/aggregates/order/order.aggregate';
import { IOrderRepository } from '../../domain/interfaces/order.repository.interface';
import { IProductProvider, ProductDetails } from '../../domain/interfaces/product.provider.interface';
import { IPromotionProvider, PromotionValidationResult, PromotionValidationContext } from '../../domain/interfaces/promotion.provider.interface';
import { InvalidOrderStateException } from '../../domain/exceptions/invalid-order-state.exception';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCalculationService, CalculatedTotals } from '../../domain/services/order-calculation.service';
import { OrderNotFoundException } from '../../domain/exceptions/order-not-found.exception';
import { LineItemData, GiftOptionData, CustomerInformationData, ShippingAddressData, AppliedPromotionData } from '../../domain/aggregates/order/order.types'; // Assuming a central types file or defined inline
import { CheckoutException } from '../../domain/exceptions/checkout.exception';

// Re-define or import complex type structures if not available from a central types file
// For example, if GiftOptionData, CustomerInformationData, ShippingAddressData are needed:
// interface GiftOptionData { isGift?: boolean; message?: string; recipientName?: string; }
// interface CustomerInformationData { email: string; firstName?: string; lastName?: string; phone?: string; }
// interface ShippingAddressData { street: string; city: string; state?: string; postalCode: string; country: string; }
// interface AppliedPromotionData { promotionId: string; code?: string; description: string; discountAmount: number; }


@Injectable()
export class OrderService {
  constructor(
    @Inject(IOrderRepository) private readonly orderRepository: IOrderRepository,
    @Inject(IProductProvider) private readonly productProvider: IProductProvider,
    @Inject(IPromotionProvider) private readonly promotionProvider: IPromotionProvider,
    private readonly orderCalculationService: OrderCalculationService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new order based on the provided DTO, user context, and potentially pre-calculated shipping cost.
   * Orchestrates fetching product details, applying promotions, calculating totals, and persisting the order.
   * @param createOrderDto Data for creating the order.
   * @param userId The ID of the user placing the order.
   * @param shippingCostFromCheckout Optional pre-calculated shipping cost.
   * @returns The created Order Aggregate.
   */
  async createOrder(createOrderDto: CreateOrderDto, userId: string, shippingCostFromCheckout?: number): Promise<OrderAggregate> {
    const lineItemsData: LineItemData[] = await Promise.all(
      createOrderDto.items.map(async (itemDto: CreateOrderItemDto) => {
        const productDetails = await this.productProvider.getProductDetails(itemDto.productId);
        if (!productDetails) {
          throw new CheckoutException(`Product not found: ${itemDto.productId}`);
        }
        const isAvailable = await this.productProvider.checkStockAvailability(itemDto.productId, itemDto.quantity);
        if (!isAvailable) {
          throw new CheckoutException(`Insufficient stock for product: ${itemDto.productId}`);
        }
        return {
          productId: itemDto.productId,
          productName: productDetails.name,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice ?? productDetails.price, // Use DTO price if provided, else from catalog
          giftOption: itemDto.giftOptions as GiftOptionData, // Type assertion
        };
      }),
    );

    const customerData = createOrderDto.customerDetails as CustomerInformationData;
    const shippingAddrData = createOrderDto.shippingAddress as ShippingAddressData;
    const orderGiftOptionData = createOrderDto.giftOptions as GiftOptionData;

    const orderAggregateData: CreateOrderData = {
        merchantId: createOrderDto.merchantId,
        customerId: createOrderDto.customerId || userId,
        items: lineItemsData,
        customerDetails: customerData,
        shippingAddress: shippingAddrData, // This will be used to create ShippingInformation VO inside Aggregate.create
        promotionCodes: createOrderDto.promotionCodes,
        giftOptions: orderGiftOptionData,
        status: OrderStatus.PENDING_PAYMENT, // Initial status, might be updated by checkout service
        currency: 'USD', // TODO: Get from merchant settings or request
    };

    const orderAggregate = OrderAggregate.create(orderAggregateData);

    // If shipping cost is provided (e.g., by CheckoutService), update it on the aggregate
    if (shippingCostFromCheckout !== undefined) {
      orderAggregate.setShippingCost(shippingCostFromCheckout);
    }

    // Validate and apply promotions
    const appliedPromotionsDomainData: AppliedPromotionData[] = [];
    if (createOrderDto.promotionCodes && createOrderDto.promotionCodes.length > 0) {
      const promotionContext: PromotionValidationContext = {
        items: lineItemsData.map(li => ({ productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice })),
        customerId: createOrderDto.customerId || userId,
        merchantId: createOrderDto.merchantId,
        shippingAddress: shippingAddrData,
      };

      for (const code of createOrderDto.promotionCodes) {
        const validationResult = await this.promotionProvider.validatePromotion(code, promotionContext);
        if (validationResult) {
          const promoData: AppliedPromotionData = {
            promotionId: validationResult.promotionId,
            code: validationResult.code,
            description: validationResult.description,
            discountAmount: validationResult.discountAmount,
          };
          orderAggregate.applyPromotion(promoData); // Adds to the aggregate's list
          appliedPromotionsDomainData.push(promoData);
        }
      }
    }

    // Calculate final totals using the OrderCalculationService
    // The service uses the aggregate's current state (items, applied promotions, shipping cost)
    const finalTotals: CalculatedTotals = this.orderCalculationService.calculateOrderTotals(orderAggregate);
    orderAggregate.setCalculatedTotalAmount(finalTotals.totalAmount); // Update the aggregate's total

    // Save the aggregate
    const savedOrder = await this.orderRepository.save(orderAggregate);

    // Publish OrderPlacedEvent
    // Note: This event might be better named OrderCreatedEvent if payment is not yet confirmed.
    // Or CheckoutService emits OrderPaymentSucceededEvent.
    // For now, OrderPlacedEvent as per spec.
    const orderPlacedEvent = new OrderPlacedEvent(savedOrder.id, savedOrder.merchantId);
    this.eventEmitter.emit('order.placed', orderPlacedEvent);

    return savedOrder;
  }

  /**
   * Finds an order by its ID for a specific merchant.
   * @param orderId The ID of the order.
   * @param merchantId The ID of the merchant.
   * @returns The Order Aggregate or null if not found or not owned by merchant.
   */
  async findOrderById(orderId: string, merchantId: string): Promise<OrderAggregate | null> {
    const order = await this.orderRepository.findById(orderId);

    if (order && order.merchantId !== merchantId) {
      console.warn(`Security: Merchant ${merchantId} attempted to access order ${orderId} belonging to merchant ${order.merchantId}.`);
      return null; // Or throw an authorization-specific exception
    }
    if (!order) {
        // Throwing here makes controller handling simpler
        // throw new OrderNotFoundException(`Order with ID "${orderId}" not found for merchant "${merchantId}".`);
        // Per spec, controller handles OrderNotFoundException, so service can return null.
    }
    return order;
  }

  /**
   * Finds orders for a specific merchant with optional pagination.
   * @param merchantId The ID of the merchant.
   * @param paginationOptions Optional pagination parameters.
   * @returns A list of Order Aggregates.
   */
  async findOrdersByMerchantId(merchantId: string, paginationOptions?: any): Promise<OrderAggregate[]> {
      return this.orderRepository.findByMerchantId(merchantId, paginationOptions);
  }

  /**
   * Updates the status of an order.
   * @param orderId The ID of the order.
   * @param newStatus The new status to set.
   * @param merchantId Optional: for validating ownership if called by a merchant.
   * @returns The updated Order Aggregate.
   * @throws OrderNotFoundException if the order does not exist.
   * @throws InvalidOrderStateException if the status transition is invalid.
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, merchantId?: string): Promise<OrderAggregate> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new OrderNotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (merchantId && order.merchantId !== merchantId) {
        throw new OrderNotFoundException(`Order with ID "${orderId}" not found for merchant "${merchantId}".`); // Or an authorization exception
    }

    const oldStatus = order.status;
    order.updateStatus(newStatus); // Domain logic for transition validation is in the aggregate

    const updatedOrder = await this.orderRepository.save(order);

    // Publish OrderStatusChangedEvent
    const orderStatusChangedEvent = new OrderStatusChangedEvent(order.id, oldStatus, newStatus);
    this.eventEmitter.emit('order.status.changed', orderStatusChangedEvent);

    return updatedOrder;
  }
}