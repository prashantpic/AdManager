import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

// This is a placeholder. In a real app, this would involve a more robust auth system (e.g., JWT, session)
// and interaction with an AuthModule or Passport strategies.
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
    // other user properties
  };
}

@Injectable()
export class MerchantGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      // This should ideally be caught by a global authentication guard first
      throw new ForbiddenException('Authentication required.');
    }

    // REQ-8-001, REQ-8-009, REQ-8-015 (routes protected by this guard)
    const hasMerchantRole = user.roles && user.roles.includes('MERCHANT'); // 'MERCHANT' is an example role name

    if (!hasMerchantRole) {
      throw new ForbiddenException('Access denied. Merchant role required.');
    }

    return true;
  }
}