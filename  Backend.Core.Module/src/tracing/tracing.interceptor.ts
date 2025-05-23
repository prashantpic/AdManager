import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as AWSXRay from 'aws-xray-sdk-core';
import { IncomingMessage, ServerResponse } from 'http';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<IncomingMessage>();
    // const response = httpContext.getResponse<ServerResponse>(); // Used if segment is closed here manually

    // For NestJS microservices or GraphQL, context type will differ
    // This interceptor is primarily for HTTP.

    const segment = AWSXRay.getSegment(); // Get the current segment (likely created by Express middleware if used)
    
    // If no segment, and X-Ray is not auto-creating for Express, create one.
    // This depends on whether AWSXRay.express.openSegment is used in main.ts
    // For simplicity, let's assume a segment exists or we create a subsegment.
    // const name = `${request.method} ${request.url}`;

    return AWSXRay.captureAsyncFunc('## NestJSHandler', (subsegment) => {
      if (!subsegment) {
        // This case should ideally not happen if X-Ray is properly configured
        // or if running inside a Lambda environment where a segment is provided.
        // For local dev without daemon, subsegment might be null if context missing strategy doesn't create one.
        return next.handle();
      }

      subsegment.addAnnotation('nestjs.handler', context.getHandler().name);
      subsegment.addAnnotation('nestjs.class', context.getClass().name);
      
      if (request.method && request.url) {
        subsegment.addIncomingRequestData(new AWSXRay.IncomingRequestData(request));
      }

      // You can add user information if available from request (e.g., after authentication)
      // if (request.user) {
      //   subsegment.setUser(request.user.id);
      // }

      return next.handle().pipe(
        tap((data) => {
          // Add response metadata if needed, though X-Ray SDK often handles status_code
          // subsegment.addMetadata('response.body', data); // Be careful with large responses
          const res = httpContext.getResponse<ServerResponse>();
          if (res.statusCode) {
             subsegment.addMetadata('response.status_code', res.statusCode);
          }
          subsegment.close();
        }),
        catchError((err) => {
          subsegment.addError(err);
          if (err instanceof HttpException) {
            subsegment.addMetadata('error.status_code', err.getStatus());
          }
          subsegment.close(err);
          throw err;
        }),
      );
    }, segment); // Pass parent segment if available
  }
}