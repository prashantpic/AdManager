import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as AWSXRay from 'aws-xray-sdk-core';
import { IncomingMessage, ServerResponse } from 'http';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TracingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<IncomingMessage>();
    const response = httpContext.getResponse<ServerResponse>();

    if (!request || !request.method || !request.url) {
      return next.handle(); // Not an HTTP request context we can trace effectively
    }
    
    const segmentName = `${request.method} ${request.url}`;
    // Create a new segment or use the existing one if propagated by upstream (e.g., API Gateway)
    const segment = AWSXRay.getSegment();
    let subsegment: AWSXRay.Subsegment | AWSXRay.Segment;

    if (segment && segment instanceof AWSXRay.Segment) {
         // If root segment exists, create subsegment for controller/method
        subsegment = segment.addNewSubsegment(segmentName);
    } else {
        // This might occur if not running within an existing X-Ray segment (e.g. Lambda, ECS with X-Ray enabled)
        // Or if X-Ray Express middleware isn't used and this is the first point of X-Ray instrumentation.
        // For HTTP requests, typically an X-Ray Express middleware or Lambda instrumentation would create the root segment.
        // Here, we'll create a new segment if none exists.
        subsegment = new AWSXRay.Segment(segmentName, request.headers['x-amzn-trace-id'] as string);
    }


    AWSXRay.setSegment(subsegment);

    // Add request data as annotations or metadata
    subsegment.addAnnotation('method', request.method);
    subsegment.addAnnotation('url', request.url);
    if (request.headers['user-agent']) {
      subsegment.addMetadata('user_agent', request.headers['user-agent']);
    }
    // Potentially add user ID if available from request context after authentication
    // if (request.user && request.user.id) {
    //   subsegment.setUser(request.user.id);
    // }

    return next.handle().pipe(
      tap(() => {
        if (response.statusCode) {
          subsegment.addAnnotation('status_code', response.statusCode);
          if (response.statusCode >= 400 && response.statusCode < 500) {
            subsegment.fault = true;
          } else if (response.statusCode >= 500) {
            subsegment.error = true;
          }
        }
        subsegment.close();
      }),
      catchError((error) => {
        subsegment.addError(error);
        subsegment.close(error);
        throw error;
      }),
    );
  }
}