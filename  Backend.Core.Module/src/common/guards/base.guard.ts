import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * @class BaseGuard
 * @description Abstract base class for implementing NestJS guards.
 * Provides common helper methods for guard implementations.
 */
@Injectable()
export abstract class BaseGuard implements CanActivate {
  /**
   * Abstract method to be implemented by concrete guards.
   * Determines if the current request is authorized.
   *
   * @param context The execution context of the current request.
   * @returns A boolean or a Promise/Observable resolving to a boolean.
   */
  abstract canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;

  /**
   * Helper method to get the request object from the execution context.
   * Supports both HTTP and RPC contexts.
   *
   * @param context The execution context.
   * @returns The request object, or undefined if not found.
   */
  protected getRequest<T = any>(context: ExecutionContext): T {
    const type = context.getType();
    if (type === 'http') {
      return context.switchToHttp().getRequest<T>();
    } else if (type === 'rpc') {
      return context.switchToRpc().getData<T>();
    } else if (type === 'ws') {
      return context.switchToWs().getData<T>();
    }
    // For other types, or if a more generic approach is needed,
    // one might need to inspect context.getArgs() or context.getHandler() / context.getClass()
    // However, for typical HTTP/REST APIs, switchToHttp() is primary.
    return undefined as T; // Or throw an error for unsupported context type
  }

  /**
   * Placeholder helper method to extract user information from the request.
   * Concrete guards (e.g., AuthGuard) would implement the actual logic.
   *
   * @param request The request object.
   * @returns The user object or undefined.
   */
  protected getUserFromRequest<UserType = any>(request: any): UserType | undefined {
    return request.user as UserType;
  }
}