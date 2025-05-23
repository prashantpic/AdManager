import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';

// Assuming Express request object structure after authentication guard
interface AuthenticatedRequest extends Request {
  user?: {
    merchantId: string;
    // other user properties
  };
}

@Injectable({ scope: Scope.REQUEST })
export class UserContextProviderAdapter implements IUserContextProvider {
  constructor(@Inject(REQUEST) private readonly request: AuthenticatedRequest) {}

  getMerchantId(): string {
    const merchantId = this.request.user?.merchantId;
    if (!merchantId) {
      throw new UnauthorizedException(
        'Merchant ID not found in request context.',
      );
    }
    return merchantId;
  }

  // Potentially add other context methods like getUserId() if needed
  getUserId(): string | null {
    // Assuming userId might also be on request.user
    // return this.request.user?.id || null;
    return null; // Placeholder
  }
}