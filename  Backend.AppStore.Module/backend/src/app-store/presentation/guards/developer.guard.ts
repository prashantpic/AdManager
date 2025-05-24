import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

@Injectable()
export class DeveloperGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // REQ-8-003, REQ-8-005 (routes protected by this guard)
    const hasDeveloperRole = user.roles && user.roles.includes('DEVELOPER'); // 'DEVELOPER' is an example role name

    if (!hasDeveloperRole) {
      throw new ForbiddenException('Access denied. Developer role required.');
    }
    
    return true;
  }
}