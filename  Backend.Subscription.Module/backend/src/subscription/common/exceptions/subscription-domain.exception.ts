import { HttpException, HttpStatus } from '@nestjs/common';

export class SubscriptionDomainException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR, cause?: Error) {
    super(
      HttpException.createBody(message, `Subscription Error`, status),
      status,
      { cause },
    );
  }
}