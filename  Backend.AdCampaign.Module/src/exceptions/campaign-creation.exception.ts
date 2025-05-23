import { HttpException, HttpStatus } from '@nestjs/common';

export class CampaignCreationException extends HttpException {
  constructor(message: string, errors?: Record<string, any>) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: message || 'Campaign creation failed due to business rule violations.',
        errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}