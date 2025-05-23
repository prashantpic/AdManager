import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../interfaces/jwt-payload.interface'; // Assuming this will be created
import { UserEntity } from '../../user/entities/user.entity';

export const IS_MFA_PROTECTED_KEY = 'isMfaProtected';
export const MfaProtected = () => Reflect.setMetadata(IS_MFA_PROTECTED_KEY, true);


@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMfaProtected = this.reflector.getAllAndOverride<boolean>(IS_MFA_PROTECTED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is not specifically marked as MFA protected, then this guard doesn't block.
    // It is assumed JwtAuthGuard has already run and a user object is present.
    if (!isMfaProtected) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserEntity & { isMfaAuthenticated?: boolean }; // User from JwtStrategy

    if (!user) {
      // This case should ideally be caught by JwtAuthGuard
      throw new ForbiddenException('Authentication required.');
    }

    // If MFA is enabled for the user, they must be MFA authenticated
    if (user.isMfaEnabled) {
      if (!user.isMfaAuthenticated) {
        throw new ForbiddenException('MFA verification required.');
      }
    }
    // If MFA is not enabled, or if it is enabled and they are MFA authenticated, access is granted.
    return true;
  }
}