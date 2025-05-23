import { ForbiddenException } from '@nestjs/common';

export class CampaignLimitException extends ForbiddenException {
  constructor(limitType: string, message?: string) {
    super(
      message || `Campaign operation exceeds the allowed limit for: ${limitType}. Please upgrade your plan or adjust existing campaigns.`,
    );
  }
}