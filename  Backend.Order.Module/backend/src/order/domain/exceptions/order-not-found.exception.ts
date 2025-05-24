import { NotFoundException } from '@nestjs/common';

/**
 * Exception for when an order cannot be found.
 * Handles cases where a requested order does not exist in the system.
 */
export class OrderNotFoundException extends NotFoundException {
  constructor(message: string = 'Order not found.') {
    super(message);
  }
}