import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // REQ-8-004 (routes protected by this guard)
    const hasAdminRole = user.roles && user.roles.includes('ADMIN'); // 'ADMIN' is an example role name

    if (!hasAdminRole) {
      throw new ForbiddenException('Access denied. Administrator role required.');
    }
    
    return true;
  }
}