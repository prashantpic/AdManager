import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * @description Abstract base guard class.
 * Provides a common structure for other guards to extend.
 * Concrete guards should implement the `canActivate` method.
 */
@Injectable()
export abstract class BaseGuard implements CanActivate {
  abstract canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;

  /**
   * Helper method to get the request object from the execution context.
   * @param context - The execution context.
   * @returns The request object.
   */
  protected getRequest<T = any>(context: ExecutionContext): T {
    switch (context.getType()) {
      case 'http':
        return context.switchToHttp().getRequest<T>();
      case 'ws':
        return context.switchToWs().getClient<T>(); // Or .getData<T>() depending on need
      case 'rpc':
        return context.switchToRpc().getData<T>();
      // NestJS does not have a 'graphql' type directly in getType(),
      // GraphQL context needs to be handled specifically using GqlExecutionContext
      default:
        // For GraphQL, you might need to use GqlExecutionContext.create(context).getContext().req
        // This base guard might not be suitable for GraphQL without specific adaptation.
        return context.switchToHttp().getRequest<T>(); // Fallback, assuming HTTP most common
    }
  }

  /**
   * Placeholder for extracting user from request.
   * Specific implementation would depend on how user information is attached to the request (e.g., by an authentication guard).
   * @param request - The request object.
   * @returns The user object or undefined.
   */
  // protected getUserFromRequest(request: any): any | undefined {
  //   return request.user;
  // }
}