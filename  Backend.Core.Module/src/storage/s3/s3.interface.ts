```typescript
import {
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
  GetObjectCommandOutput,
  UploadPartCommandOutput // For multipart uploads
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * @description Options for uploading a file to S3.
 */
export interface S3UploadOptions {
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'aws-exec-read' | 'bucket-owner-read' | 'bucket-owner-full-control';
  metadata?: Record<string, string>;
  serverSideEncryption?: string; // e.g., 'AES256' or 'aws:kms'
  sseKmsKeyId?: string; // if serverSideEncryption is 'aws:kms'
  cacheControl?: string;
  expires?: Date;
}

/**
 * @description Result of downloading a file from S3.
 */
export interface S3DownloadOutput {
  body?: Readable | Blob | ReadableStream<any> | undefined; // SDK GetObjectCommandOutput Body type
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
  eTag?: string;
  lastModified?: Date;
}

/**
 * @interface IS3Service
 * @description Defines the contract for an S3 interaction service,
 * specifying standard operations for object storage.
 */
export interface IS3Service {
  /**
   * Uploads a file/object to an S3 bucket.
   * @param bucketName - The name of the S3 bucket.
   * @param key - The key (path and filename) for the object in the bucket.
   * @param body - The content of the file (Buffer, string, Readable stream, Blob).
   * @param options - Optional S3 upload configurations.
   * @returns A promise resolving to the PutObjectCommandOutput from AWS SDK.
   */
  uploadFile(
    bucketName: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string | Readable,
    options?: S3UploadOptions,
  ): Promise<PutObjectCommandOutput>;

  /**
   * Downloads a file/object from an S3 bucket.
   * @param bucketName - The name of the S3 bucket.
   * @param key - The key of the object to download.
   * @returns A promise resolving to an S3DownloadOutput object containing the file's body and metadata.
   */
  downloadFile(
    bucketName: string,
    key: string,
  ): Promise<S3DownloadOutput>;

  /**
   * Deletes a file/object from an S3 bucket.
   * @param bucketName - The name of the S3 bucket.
   * @param key - The key of the object to delete.
   * @returns A promise resolving to the DeleteObjectCommandOutput from AWS SDK.
   */
  deleteFile(
    bucketName: string,
    key: string,
  ): Promise<DeleteObjectCommandOutput>;

  /**
   * Generates a pre-signed URL for accessing an S3 object (e.g., for GET or PUT operations).
   * @param bucketName - The name of the S3 bucket.
   * @param key - The key of the object.
   * @param operation - The S3 operation for which to generate the URL (e.g., 'getObject', 'putObject'). Defaults to 'getObject'.
   * @param expiresInSeconds - The duration (in seconds) for which the URL will be valid. Defaults to 3600 (1 hour).
   * @returns A promise resolving to the pre-signed URL string.
   */
  getPresignedUrl(
    bucketName: string,
    key: string,
    operation?: 'getObject' | 'putObject', // Add more operations as needed
    expiresInSeconds?: number,
  ): Promise<string>;

  /**
   * Checks if an object exists in S3.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @returns A promise that resolves to true if the object exists, false otherwise.
   */
  doesObjectExist(bucketName: string, key: string): Promise<boolean>;

   /**
   * Initiates a multipart upload.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @param options Optional S3 upload configurations.
   * @returns A promise that resolves to the Upload ID.
   */
  initiateMultipartUpload(
    bucketName: string,
    key: string,
    options?: S3UploadOptions,
  ): Promise<string | undefined>;

  /**
   * Uploads a part in a multipart upload.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @param uploadId The ID of the multipart upload.
   * @param partNumber The part number.
   * @param body The content of the part.
   * @param contentLength The length of the content part.
   * @returns A promise that resolves to the ETag of the uploaded part.
   */
  uploadPart(
    bucketName: string,
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array | Blob | string | Readable,
    contentLength?: number,
  ): Promise<UploadPartCommandOutput>;

  /**
   * Completes a multipart upload.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @param uploadId The ID of the multipart upload.
   * @param parts An array of parts with ETag and PartNumber.
   * @returns A promise that resolves to the output of the complete multipart upload command.
   */
  completeMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<PutObjectCommandOutput>; // CompleteMultipartUploadCommandOutput has similar structure to PutObjectCO

  /**
   * Aborts a multipart upload.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @param uploadId The ID of the multipart upload.
   * @returns A promise that resolves when the abort is complete.
   */
  abortMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
  ): Promise<void>;

}

export const IS3Service = Symbol('IS3Service');
```