import { Injectable, Logger } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk-core';

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);

  private getValidSegment(): AWSXRay.Segment | AWSXRay.Subsegment | undefined {
    try {
      return AWSXRay.getSegment();
    } catch (e) {
      this.logger.warn('No active X-Ray segment found to add metadata/annotation.');
      return undefined;
    }
  }

  addAnnotation(key: string, value: string | number | boolean): void {
    const segment = this.getValidSegment();
    if (segment) {
      try {
        segment.addAnnotation(key, value);
      } catch (error) {
        this.logger.error(`Failed to add annotation: ${key}`, error);
      }
    }
  }

  addMetadata(
    key: string,
    value: any,
    namespace: string = 'default',
  ): void {
    const segment = this.getValidSegment();
    if (segment) {
      try {
        segment.addMetadata(key, value, namespace);
      } catch (error) {
        this.logger.error(
          `Failed to add metadata: ${key} in namespace ${namespace}`,
          error,
        );
      }
    }
  }

  async captureAsync<T>(
    name: string,
    asyncFunction: (subsegment?: AWSXRay.Subsegment) => Promise<T>,
  ): Promise<T> {
    const currentSegment = this.getValidSegment();
    if (!currentSegment) {
      this.logger.warn(`No active segment to capture async function: ${name}`);
      return asyncFunction(); // Execute without subsegment
    }
    return AWSXRay.captureAsyncFunc(name, asyncFunction, currentSegment);
  }

  captureSync<T>(
    name: string,
    syncFunction: (subsegment?: AWSXRay.Subsegment) => T,
  ): T {
    const currentSegment = this.getValidSegment();
    if (!currentSegment) {
      this.logger.warn(`No active segment to capture sync function: ${name}`);
      return syncFunction(); // Execute without subsegment
    }
    return AWSXRay.captureFunc(name, syncFunction, currentSegment);
  }

  beginSubsegment(name: string): AWSXRay.Subsegment | undefined {
    const segment = this.getValidSegment();
    if (segment) {
      return segment.addNewSubsegment(name);
    }
    this.logger.warn(`No active segment to begin subsegment: ${name}`);
    return undefined;
  }

  endSubsegment(subsegment?: AWSXRay.Subsegment, error?: Error | string): void {
    if (subsegment) {
      if (error) {
        subsegment.addError(error);
      }
      subsegment.close();
    }
  }

  getTraceId(): string | undefined {
    const segment = this.getValidSegment();
    return segment?.trace_id;
  }
}