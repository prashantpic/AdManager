import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../user/user.service';
import { ROLES_KEY } from '../decorators/roles.decorator'; // Assuming this will be created
import { UserEntity } from '../../user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles specified, access granted
    }

    const { user } = context.switchToHttp().getRequest<{ user: UserEntity & { rolesFromToken?: string[] } }>();
    if (!user) {
      return false; // No user attached to request, should be handled by AuthGuard
    }

    // Prefer roles from the validated token if available and strategy attaches them
    // This ensures consistency with the token's state at the time of issue.
    // Otherwise, fetch fresh roles from DB. This could be configurable.
    const userRoles = user.rolesFromToken 
      ? user.rolesFromToken 
      : (await this.userService.getUserRoles(user.id)).map(role => role.name);
      
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}