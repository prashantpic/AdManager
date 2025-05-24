import { OrderAggregate } from '../aggregates/order/order.aggregate';

export interface PaginationOptions {
    take?: number;
    skip?: number;
    order?: { [key: string]: 'ASC' | 'DESC' };
    // Add other filter criteria if needed
}

export const IOrderRepository = Symbol('IOrderRepository');

export interface IOrderRepository {
  /**
   * Saves (creates or updates) an OrderAggregate.
   * @param order The OrderAggregate instance to persist.
   * @returns A Promise resolving to the persisted OrderAggregate.
   */
  save(order: OrderAggregate): Promise<OrderAggregate>;

  /**
   * Finds an OrderAggregate by its unique ID.
   * @param orderId The ID of the order.
   * @returns A Promise resolving to the OrderAggregate or null if not found.
   */
  findById(orderId: string): Promise<OrderAggregate | null>;

  /**
   * Finds all OrderAggregates belonging to a specific merchant, with optional pagination.
   * @param merchantId The ID of the merchant.
   * @param paginationOptions Optional parameters for pagination and sorting.
   * @returns A Promise resolving to an array of OrderAggregates.
   */
  findByMerchantId(merchantId: string, paginationOptions?: PaginationOptions): Promise<OrderAggregate[]>;

  // Consider adding other common query methods:
  // findByCustomerId(customerId: string, paginationOptions?: PaginationOptions): Promise<OrderAggregate[]>;
  // findByStatus(status: OrderStatus, paginationOptions?: PaginationOptions): Promise<OrderAggregate[]>;
}