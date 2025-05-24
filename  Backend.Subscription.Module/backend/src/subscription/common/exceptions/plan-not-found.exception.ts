import { HttpStatus } from '@nestjs/common';
import { SubscriptionDomainException } from './subscription-domain.exception';

export class PlanNotFoundException extends SubscriptionDomainException {
  constructor(planIdOrIdentifier?: string) {
    const message = planIdOrIdentifier
      ? `Subscription plan with identifier "${planIdOrIdentifier}" not found.`
      : 'Subscription plan not found.';
    super(message, HttpStatus.NOT_FOUND);
  }
}