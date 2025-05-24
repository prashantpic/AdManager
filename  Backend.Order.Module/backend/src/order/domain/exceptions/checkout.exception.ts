import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * General exception for failures during the checkout process.
 * Aggregates and reports checkout-specific errors.
 */
export class CheckoutException extends HttpException {
  constructor(message: string = 'Checkout process failed.', httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, httpStatus);
  }
}