import { BadRequestException } from '@nestjs/common';

/**
 * Exception for attempts to perform operations on an order in an invalid state.
 * Handles business rule violations related to order status transitions.
 */
export class InvalidOrderStateException extends BadRequestException {
  constructor(message: string = 'Operation not allowed for the current order state.') {
    super(message);
  }
}