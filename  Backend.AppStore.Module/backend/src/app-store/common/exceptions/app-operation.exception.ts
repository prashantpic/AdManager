import { InternalServerErrorException } from '@nestjs/common';

export class AppOperationException extends InternalServerErrorException {
  constructor(message: string = 'App operation failed.') {
    super(message);
  }
}