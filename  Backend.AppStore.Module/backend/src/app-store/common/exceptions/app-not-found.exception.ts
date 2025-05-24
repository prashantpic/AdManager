import { NotFoundException } from '@nestjs/common';

export class AppNotFoundException extends NotFoundException {
  constructor(appId?: string) {
    super(appId ? `App with ID '${appId}' not found.` : 'App not found.');
  }
}