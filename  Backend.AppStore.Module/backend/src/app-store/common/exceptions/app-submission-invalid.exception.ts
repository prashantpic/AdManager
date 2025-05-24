import { BadRequestException } from '@nestjs/common';

export class AppSubmissionInvalidException extends BadRequestException {
  constructor(message: string | Record<string, any> = 'Invalid app submission.') {
    super(message);
  }
}