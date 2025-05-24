import { Controller, Post, Get, Body, Param, ParseUUIDPipe, UsePipes, ValidationPipe, HttpStatus, HttpException, Patch } from '@nestjs/common';
import { OrderService } from './application/services/order.service';
import { CheckoutService } from './application/services/checkout.service';
import { CreateOrderDto } from './application/dtos/create-order.dto';
import { OrderDto } from './application/dtos/order.dto';
import { OneClickPurchaseRequestDto } from './application/dtos/one-click-purchase-request.dto';
import { OrderMapper } from './application/mappers/order.mapper';
import { OrderNotFoundException } from './domain/exceptions/order-not-found.exception';
import { InvalidOrderStateException } from './domain/exceptions/invalid-order-state.exception';
import { CheckoutException } from './domain/exceptions/checkout.exception';
import { OrderStatus } from './domain/enums/order-status.enum';
// import { AuthGuard } from '@nestjs/passport'; // Assuming JWT guard from UserAuthModule
// import { GetUser } from '@userauth/decorators/get-user.decorator'; // Custom decorator to get user from request

// @UseGuards(AuthGuard('jwt')) // Apply to all routes or specific ones
@Controller('orders')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
    private readonly orderMapper: OrderMapper,
  ) {}

  /**
   * Initiates the checkout process for an order.
   * @param createOrderDto - DTO containing order creation details.
   * @param user - Authenticated user object (injected by AuthGuard/GetUser decorator).
   * @returns The created order DTO.
   */
  @Post('checkout')
  async initiateCheckout(
    @Body() createOrderDto: CreateOrderDto,
    // @GetUser() user: { userId: string; merchantId?: string }, // Example of getting authenticated user
  ): Promise<OrderDto> {
    try {
      // TODO: Replace placeholder userId with actual authenticated user's ID.
      // const userId = user.userId;
      const userId = 'mock-user-id-from-auth'; // Placeholder
      const order = await this.checkoutService.processCheckout(createOrderDto, userId);
      return this.orderMapper.toDto(order);
    } catch (error) {
      if (error instanceof CheckoutException) {
        throw new HttpException(error.message, error.getStatus() || HttpStatus.BAD_REQUEST);
      }
      if (error instanceof OrderNotFoundException) { // e.g. Product not found during checkout
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      // Log unexpected errors
      console.error('Checkout failed:', error);
      throw new HttpException('Internal server error during checkout', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Processes a one-click purchase for a returning authenticated customer.
   * @param oneClickPurchaseDto - DTO containing items for one-click purchase.
   * @param user - Authenticated user object.
   * @returns The created order DTO.
   */
  @Post('one-click-purchase')
  async oneClickPurchase(
    @Body() oneClickPurchaseDto: OneClickPurchaseRequestDto,
    // @GetUser() user: { userId: string }, // Example of getting authenticated user
  ): Promise<OrderDto> {
    try {
      // TODO: Replace placeholder userId with actual authenticated user's ID.
      // const userId = user.userId;
      const userId = 'mock-user-id-from-auth'; // Placeholder
      const order = await this.checkoutService.processOneClickPurchase(oneClickPurchaseDto, userId);
      return this.orderMapper.toDto(order);
    } catch (error) {
      if (error instanceof CheckoutException) {
        throw new HttpException(error.message, error.getStatus() || HttpStatus.BAD_REQUEST);
      }
      if (error instanceof OrderNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      // Log unexpected errors
      console.error('One-click purchase failed:', error);
      throw new HttpException('Internal server error during one-click purchase', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves a specific order by its ID.
   * Access control should ensure the user/merchant has permission to view this order.
   * @param orderId - The UUID of the order.
   * @param user - Authenticated user object, containing merchantId if applicable.
   * @returns The order DTO.
   */
  @Get(':orderId')
  async getOrderById(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    // @GetUser() user: { userId: string; merchantId?: string }, // Example
  ): Promise<OrderDto> {
    try {
      // TODO: Replace placeholder merchantId with actual merchant ID from authenticated user context.
      // const merchantId = user.merchantId; // Assuming merchant context for retrieval
      // If user is a customer, logic might be different (e.g., check if order.customerId matches user.userId)
      const merchantId = 'mock-merchant-id-from-auth'; // Placeholder
      const order = await this.orderService.findOrderById(orderId, merchantId);

      if (!order) {
        throw new OrderNotFoundException(`Order with ID "${orderId}" not found or access denied.`);
      }

      return this.orderMapper.toDto(order);
    } catch (error) {
       if (error instanceof OrderNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      // Log unexpected errors
      console.error(`Error fetching order ${orderId}:`, error);
      throw new HttpException('Internal server error fetching order', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Creates an order directly. This endpoint might be used for internal processes
   * or specific flows where the full checkout orchestration isn't required.
   * Full validation and product/promotion checks are still performed by OrderService.
   * @param createOrderDto - DTO containing order creation details.
   * @param user - Authenticated user object.
   * @returns The created order DTO.
   */
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    // @GetUser() user: { userId: string }, // Example
  ): Promise<OrderDto> {
    try {
      // TODO: Replace placeholder userId with actual authenticated user's ID.
      // const userId = user.userId;
      const userId = 'mock-user-id-from-auth'; // Placeholder
      const orderAggregate = await this.orderService.createOrder(createOrderDto, userId);
      return this.orderMapper.toDto(orderAggregate);
    } catch (error) {
      // Handle specific errors like product not found, promotion invalid, etc.
      // These might be wrapped in a generic error or exposed if client needs to know
      if (error instanceof OrderNotFoundException) { // e.g., Product not found
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof InvalidOrderStateException || error instanceof CheckoutException) { // Promote invalid, etc.
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      console.error('Error creating order directly:', error);
      throw new HttpException('Failed to create order', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Example: Update order status - typically for internal/merchant use
  // Add appropriate guards for authorization (e.g., merchant role)
  /**
   * Updates the status of an existing order.
   * Typically used by merchants or internal systems.
   * @param orderId - The UUID of the order to update.
   * @param statusUpdateDto - DTO containing the new status.
   * @param user - Authenticated user (merchant).
   * @returns The updated order DTO.
   */
  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() statusUpdateDto: { status: OrderStatus }, // Simple DTO for status update
    // @GetUser() user: { userId: string, merchantId: string }, // Merchant context
  ): Promise<OrderDto> {
    try {
      // TODO: Add authorization checks: ensure user.merchantId matches order.merchantId
      const order = await this.orderService.updateOrderStatus(orderId, statusUpdateDto.status);
      return this.orderMapper.toDto(order);
    } catch (error) {
      if (error instanceof OrderNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error instanceof InvalidOrderStateException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      console.error(`Error updating order status for ${orderId}:`, error);
      throw new HttpException('Internal server error updating order status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}