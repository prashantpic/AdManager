import { HttpStatus } from '@nestjs/common';
import { SubscriptionDomainException } from './subscription-domain.exception';

export class PaymentFailedException extends SubscriptionDomainException {
  constructor(reason: string, details?: any) {
    const message = `Payment failed: ${reason}`;
    // Consider mapping specific gateway errors to more user-friendly messages or codes
    super(message, HttpStatus.BAD_REQUEST, details instanceof Error ? details : undefined);
    // If details are not an error, they can be logged or attached differently.
    // For NestJS HttpException, the third parameter `options.cause` expects an Error.
  }
}