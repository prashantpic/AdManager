import { HttpException, HttpStatus } from '@nestjs/common';
import { FeatureKey } from '../constants/feature.constants';

export class FeatureNotAvailableException extends HttpException {
  constructor(featureKey: FeatureKey, message?: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message:
          message ||
          `Feature '${featureKey}' is not available with your current plan.`,
        featureKey,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}