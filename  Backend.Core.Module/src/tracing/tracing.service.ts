import { Injectable, Logger } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk-core';

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);

  addAnnotation(key: string, value: string | number | boolean): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation(key, value);
    } else {
      this.logger.warn(
        `No active X-Ray segment found. Cannot add annotation: ${key}`,
      );
    }
  }

  addMetadata(
    key: string,
    value: any,
    namespace: string = 'default',
  ): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata(key, value, namespace);
    } else {
      this.logger.warn(
        `No active X-Ray segment found. Cannot add metadata: ${key} in namespace ${namespace}`,
      );
    }
  }

  async captureAsync<T>(
    name: string,
    asyncFunction: (subsegment?: AWSXRay.Subsegment) => Promise<T>,
    parentSegment?: AWSXRay.Segment | AWSXRay.Subsegment,
  ): Promise<T> {
    const currentSegment = parentSegment || AWSXRay.getSegment();
    if (!currentSegment) {
      this.logger.warn(
        `No active X-Ray segment or parent provided for ${name}. Running function without new subsegment.`,
      );
      // Execute the function directly without creating a subsegment if no parent segment is available.
      // This might happen if X-Ray is disabled or not properly initialized.
      return asyncFunction();
    }
    return AWSXRay.captureAsyncFunc(name, asyncFunction, currentSegment);
  }

  capture<T>(
    name: string,
    syncFunction: (subsegment?: AWSXRay.Subsegment) => T,
    parentSegment?: AWSXRay.Segment | AWSXRay.Subsegment,
  ): T {
    const currentSegment = parentSegment || AWSXRay.getSegment();
     if (!currentSegment) {
      this.logger.warn(
        `No active X-Ray segment or parent provided for ${name}. Running function without new subsegment.`,
      );
      return syncFunction();
    }
    const subsegment = currentSegment.addNewSubsegment(name);
    try {
      const result = syncFunction(subsegment);
      subsegment.close();
      return result;
    } catch (error) {
      subsegment.close(error);
      throw error;
    }
  }

  getCurrentSegment(): AWSXRay.Segment | AWSXRay.Subsegment | undefined {
    return AWSXRay.getSegment();
  }

  getTraceId(): string | undefined {
    const segment = AWSXRay.getSegment();
    return segment?.trace_id;
  }
}