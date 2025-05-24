import { HttpException, HttpStatus } from '@nestjs/common';
import { FeatureKey } from '../constants/feature.constants';

export class EntitlementViolationException extends HttpException {
  constructor(
    featureKey: FeatureKey,
    message: string,
    limit?: number,
    currentUsage?: number,
    requestedUsage?: number,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN, // Or HttpStatus.TOO_MANY_REQUESTS (429)
        error: 'Forbidden',
        message,
        featureKey,
        limit,
        currentUsage,
        requestedUsage,
      },
      HttpStatus.FORBIDDEN, // Or HttpStatus.TOO_MANY_REQUESTS (429)
    );
  }
}