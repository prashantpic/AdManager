import { BadRequestException } from '@nestjs/common';

export class InvalidAudienceDataException extends BadRequestException {
  constructor(message?: string, errors?: Record<string, any>) {
    super({
      message: message || 'Invalid audience data provided.',
      errors: errors,
    });
  }
}