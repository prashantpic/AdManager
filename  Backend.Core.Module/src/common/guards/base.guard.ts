import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * @file Base guard class providing common functionalities or an abstract structure.
 * @namespace AdManager.Platform.Backend.Core.Common.Guards
 */

@Injectable()
export abstract class BaseGuard implements CanActivate {
  abstract canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;

  /**
   * Helper to get the request object from the execution context.
   * Handles different context types (HTTP, RPC, WebSockets).
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
    // For unknown types, you might throw an error or return a default
    // For now, assuming it's an HTTP context if not specified or unknown
    return context.switchToHttp().getRequest<T>();
  }

  /**
   * Example: Helper to extract user from request (assuming user is attached by an auth guard)
   * This would typically be more specific in an AuthGuard.
   */
  // protected getUserFromRequest(request: any): any | null {
  //   return request.user || null;
  // }
}