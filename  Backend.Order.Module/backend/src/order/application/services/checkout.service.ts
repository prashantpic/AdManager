import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { OneClickPurchaseRequestDto } from '../dtos/one-click-purchase-request.dto';
import { OrderAggregate } from '../../domain/aggregates/order/order.aggregate';
import { OrderService } from './order.service';
import { ICustomerDataProvider, SavedCustomerProfile } from '../../domain/interfaces/customer-data.provider.interface';
import { IPaymentProvider, PaymentRequestData, PaymentResponseData } from '../../domain/interfaces/payment.provider.interface';
import { IShippingProvider, ShippingCalculationRequest, ShippingOption } from '../../domain/interfaces/shipping.provider.interface';
import { IProductProvider } from '../../domain/interfaces/product.provider.interface'; // Not directly used here but good for consistency
import { IPromotionProvider } from '../../domain/interfaces/promotion.provider.interface'; // Not directly used here
import { CheckoutException } from '../../domain/exceptions/checkout.exception';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { CustomerDetailsDto as AppCustomerDetailsDto, ShippingAddressDto as AppShippingAddressDto, OrderItemDto as AppOrderItemDto } from '../dtos/create-order.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly orderService: OrderService,
    @Inject(ICustomerDataProvider) private readonly customerDataProvider: ICustomerDataProvider,
    @Inject(IPaymentProvider) private readonly paymentProvider: IPaymentProvider,
    @Inject(IShippingProvider) private readonly shippingProvider: IShippingProvider,
    // @Inject(IProductProvider) private readonly productProvider: IProductProvider, // OrderService handles product interactions
    // @Inject(IPromotionProvider) private readonly promotionProvider: IPromotionProvider, // OrderService handles promotion interactions
  ) {}

  /**
   * Orchestrates the standard checkout process.
   * Validates inputs, fetches data from providers, creates the order,
   * delegates payment processing, and updates order status.
   * @param createOrderDto Data for creating the order.
   * @param userId The ID of the user initiating checkout.
   * @returns The finalized Order Aggregate.
   * @throws CheckoutException on failure at any stage.
   */
  async processCheckout(createOrderDto: CreateOrderDto, userId: string): Promise<OrderAggregate> {
    let orderAggregate: OrderAggregate | null = null; // To hold the order for potential rollback/status update

    try {
      // 1. Calculate shipping costs
      const shippingRequest: ShippingCalculationRequest = {
        items: createOrderDto.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        destinationAddress: createOrderDto.shippingAddress,
        merchantId: createOrderDto.merchantId,
      };
      const shippingOptions = await this.shippingProvider.getShippingOptions(shippingRequest);
      if (!shippingOptions || shippingOptions.length === 0) {
        throw new CheckoutException('Could not retrieve shipping options.');
      }
      // TODO: Allow user to select a shipping option from the frontend.
      // For now, pick the first or cheapest one.
      const selectedShippingOption = shippingOptions.sort((a, b) => a.cost - b.cost)[0];

      // 2. Create the initial order aggregate (status PENDING_PAYMENT).
      // OrderService.createOrder will handle product validation, promotions, and initial total calculation including this shipping cost.
      orderAggregate = await this.orderService.createOrder(
        createOrderDto,
        userId,
        selectedShippingOption.cost, // Pass the calculated shipping cost
      );

      // 3. Delegate Payment Processing
      // TODO: CreateOrderDto needs to be extended or a separate DTO for payment details is needed
      // For now, assume payment details (like a token or saved method ID) are part of CreateOrderDto or handled by PaymentProvider
      const paymentData: PaymentRequestData = {
        orderId: orderAggregate.id,
        amount: orderAggregate.totalAmount,
        currency: orderAggregate.currency,
        customerDetails: createOrderDto.customerDetails, // Assuming DTO maps to what PaymentProvider needs
        // paymentToken: createOrderDto.paymentToken, // Example: if DTO contains it
        // paymentMethodId: createOrderDto.paymentMethodId, // Example
      };
      const paymentResponse = await this.paymentProvider.processPayment(paymentData);

      if (paymentResponse.status !== 'SUCCESS') {
        // Payment failed: Update order status to FAILED and throw exception
        await this.orderService.updateOrderStatus(orderAggregate.id, OrderStatus.FAILED, orderAggregate.merchantId);
        throw new CheckoutException(`Payment failed: ${paymentResponse.errorMessage || paymentResponse.status}`);
      }

      // 4. Payment successful: Update order status to AWAITING_SHIPMENT (or PROCESSING)
      const finalizedOrder = await this.orderService.updateOrderStatus(
        orderAggregate.id,
        OrderStatus.AWAITING_SHIPMENT,
        orderAggregate.merchantId
      );

      return finalizedOrder;

    } catch (error) {
      console.error('Error during checkout process:', error);
      // If an order was created but a subsequent step failed (e.g., payment after order creation)
      // ensure its status is correctly marked (e.g., FAILED), if not already handled.
      // The OrderService.createOrder might throw CheckoutException for product/stock issues.
      if (orderAggregate && orderAggregate.status === OrderStatus.PENDING_PAYMENT && !(error instanceof CheckoutException && error.message.startsWith('Payment failed'))) {
           // If error is not a payment failure but order is pending payment, mark as failed before rethrowing
          try {
              await this.orderService.updateOrderStatus(orderAggregate.id, OrderStatus.FAILED, orderAggregate.merchantId);
          } catch (statusUpdateError) {
              console.error(`Failed to update order ${orderAggregate.id} to FAILED status after checkout error:`, statusUpdateError);
          }
      }

      if (error instanceof CheckoutException) {
        throw error;
      }
      // Wrap other errors to maintain consistent exception type for controller
      throw new CheckoutException(`An unexpected error occurred during checkout: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Orchestrates the one-click purchase process for returning customers.
   * @param oneClickPurchaseDto Data for one-click purchase (primarily items).
   * @param userId The ID of the authenticated user.
   * @returns The finalized Order Aggregate.
   * @throws CheckoutException on failure.
   */
  async processOneClickPurchase(oneClickPurchaseDto: OneClickPurchaseRequestDto, userId: string): Promise<OrderAggregate> {
    let orderAggregate: OrderAggregate | null = null;

    try {
      // 1. Retrieve saved customer profile
      const savedProfile = await this.customerDataProvider.getSavedCustomerDetails(userId);
      if (!savedProfile) {
        throw new CheckoutException('One-click purchase failed: Customer profile not found.');
      }

      // Select shipping address and payment method
      // TODO: Allow selection if multiple are saved, or use DTO hints (savedShippingAddressId, savedPaymentMethodId)
      const shippingAddress = oneClickPurchaseDto.savedShippingAddressId
        ? savedProfile.savedAddresses.find(a => a.id === oneClickPurchaseDto.savedShippingAddressId)?.address
        : savedProfile.savedAddresses[0]?.address;

      const paymentMethodId = oneClickPurchaseDto.savedPaymentMethodId
        ? savedProfile.savedPaymentMethods.find(pm => pm.id === oneClickPurchaseDto.savedPaymentMethodId)?.id
        : savedProfile.savedPaymentMethods[0]?.id;

      if (!shippingAddress) {
        throw new CheckoutException('One-click purchase failed: No saved shipping address found or specified one not found.');
      }
      if (!paymentMethodId) {
        throw new CheckoutException('One-click purchase failed: No saved payment method found or specified one not found.');
      }

      // TODO: Reconstruct CustomerDetailsDto from saved profile (e.g., email, name).
      // ICustomerDataProvider might need to return more complete customer details.
      // For simplicity, creating a placeholder.
      const customerDetails: AppCustomerDetailsDto = {
        email: 'user@example.com', // Placeholder - replace with actual from UserAuth
        firstName: 'John',         // Placeholder
        lastName: 'Doe',           // Placeholder
      };

      // 2. Construct CreateOrderDto for OrderService
      const createOrderDto: CreateOrderDto = {
        merchantId: 'default-merchant-id', // TODO: Determine merchant context (e.g., from user's session or config)
        customerId: userId,
        items: oneClickPurchaseDto.items as AppOrderItemDto[], // Assuming DTO structure aligns
        customerDetails: customerDetails,
        shippingAddress: shippingAddress as AppShippingAddressDto, // Type assertion
        // Promotions and gift options are typically not part_of simple one-click flow, or need UI
        promotionCodes: [],
        giftOptions: undefined,
      };

      // 3. Calculate shipping for the saved address
      const shippingRequest: ShippingCalculationRequest = {
        items: createOrderDto.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        destinationAddress: createOrderDto.shippingAddress,
        merchantId: createOrderDto.merchantId,
      };
      const shippingOptions = await this.shippingProvider.getShippingOptions(shippingRequest);
      if (!shippingOptions || shippingOptions.length === 0) {
        throw new CheckoutException('Could not retrieve shipping options for saved address.');
      }
      const selectedShippingOption = shippingOptions.sort((a, b) => a.cost - b.cost)[0];

      // 4. Create the order
      orderAggregate = await this.orderService.createOrder(
        createOrderDto,
        userId,
        selectedShippingOption.cost,
      );

      // 5. Delegate Payment Processing using saved method ID
      const paymentData: PaymentRequestData = {
        orderId: orderAggregate.id,
        amount: orderAggregate.totalAmount,
        currency: orderAggregate.currency,
        customerDetails: customerDetails, // Send reconstructed customer details
        paymentMethodId: paymentMethodId, // Use the saved payment method ID
      };
      const paymentResponse = await this.paymentProvider.processPayment(paymentData);

      if (paymentResponse.status !== 'SUCCESS') {
        await this.orderService.updateOrderStatus(orderAggregate.id, OrderStatus.FAILED, orderAggregate.merchantId);
        throw new CheckoutException(`One-click payment failed: ${paymentResponse.errorMessage || paymentResponse.status}`);
      }

      // 6. Payment successful: Update order status
      const finalizedOrder = await this.orderService.updateOrderStatus(
        orderAggregate.id,
        OrderStatus.AWAITING_SHIPMENT,
        orderAggregate.merchantId
      );

      return finalizedOrder;

    } catch (error) {
      console.error('Error during one-click purchase process:', error);
       if (orderAggregate && orderAggregate.status === OrderStatus.PENDING_PAYMENT && !(error instanceof CheckoutException && error.message.includes('payment failed'))) {
          try {
              await this.orderService.updateOrderStatus(orderAggregate.id, OrderStatus.FAILED, orderAggregate.merchantId);
          } catch (statusUpdateError) {
              console.error(`Failed to update order ${orderAggregate.id} to FAILED status after one-click checkout error:`, statusUpdateError);
          }
      }
      if (error instanceof CheckoutException) {
        throw error;
      }
      throw new CheckoutException(`An unexpected error occurred during one-click purchase: ${error.message || 'Unknown error'}`);
    }
  }
}