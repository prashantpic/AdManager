import { HttpException, HttpStatus } from '@nestjs/common';
import { AdNetworkType } from '../constants/ad-network-type.enum';

export class CampaignPublishException extends HttpException {
  constructor(adNetwork: AdNetworkType, underlyingErrorMessage: string, details?: Record<string, any>) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY, // Or 503 Service Unavailable, 500 Internal Server Error
        message: `Failed to publish or synchronize campaign with ${adNetwork}.`,
        error: underlyingErrorMessage,
        details,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}