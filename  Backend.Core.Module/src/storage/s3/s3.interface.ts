```typescript
import {
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
  GetObjectCommandOutput,
  CommonPrefix,
  _Object
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'aws-exec-read' | 'bucket-owner-read' | 'bucket-owner-full-control';
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  cacheControl?: string;
  expires?: Date;
  contentEncoding?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  serverSideEncryption?: string; // Overrides default from config if provided
  sseKmsKeyId?: string; // For SSE-KMS
}

export interface DownloadedFile {
  body: Readable | Blob | undefined; // Readable for Node.js, Blob for browser
  contentType: string | undefined;
  contentLength: number | undefined;
  metadata?: Record<string, string>;
  eTag?: string;
  lastModified?: Date;
}

export interface ListObjectsOutput {
    objects: (_Object | undefined)[];
    commonPrefixes: (CommonPrefix | undefined)[];
    nextContinuationToken?: string;
}

/**
 * @interface IS3Service
 * @description Defines the contract for the S3 interaction service,
 * specifying standard S3 operations.
 */
export interface IS3Service {
  /**
   * Uploads a file/object to an S3 bucket.
   * @param bucketName The name of the S3 bucket.
   * @param key The key (path and filename) for the object in S3.
   * @param body The content of the file (Buffer, Readable stream, string, Blob).
   * @param options Optional. Upload options like content type, ACL, metadata.
   * @returns A promise that resolves to `PutObjectCommandOutput`.
   */
  uploadFile(
    bucketName: string,
    key: string,
    body: Buffer | Readable | string | Blob,
    options?: UploadOptions,
  ): Promise<PutObjectCommandOutput>;

  /**
   * Downloads a file from an S3 bucket.
   * @param bucketName The name of the S3 bucket.
   * @param key The key of the object to download.
   * @returns A promise that resolves to a `DownloadedFile` object containing the file body and metadata.
   */
  downloadFile(
    bucketName: string,
    key: string,
  ): Promise<DownloadedFile>;

  /**
   * Deletes a file from an S3 bucket.
   * @param bucketName The name of the S3 bucket.
   * @param key The key of the object to delete.
   * @returns A promise that resolves to `DeleteObjectCommandOutput`.
   */
  deleteFile(
    bucketName: string,
    key: string,
  ): Promise<DeleteObjectCommandOutput>;

  /**
   * Deletes multiple files from an S3 bucket.
   * @param bucketName The name of the S3 bucket.
   * @param keys An array of keys of the objects to delete.
   * @returns A promise that resolves to the output of the delete multiple objects command.
   */
  deleteFiles(
    bucketName: string,
    keys: string[],
  ): Promise<any>; // AWS SDK v3 DeleteObjectsCommandOutput

  /**
   * Generates a pre-signed URL for accessing an S3 object.
   * @param bucketName The name of the S3 bucket.
   * @param key The key of the object.
   * @param expiresInSeconds The duration (in seconds) for which the URL is valid.
   * @param operation The S3 operation ('getObject', 'putObject'). Defaults to 'getObject'.
   * @returns A promise that resolves to the pre-signed URL string.
   */
  getPresignedUrl(
    bucketName: string,
    key: string,
    expiresInSeconds: number,
    operation?: 'getObject' | 'putObject',
  ): Promise<string>;

  /**
   * Checks if an object exists in S3.
   * @param bucketName The S3 bucket name.
   * @param key The object key.
   * @returns True if the object exists, false otherwise.
   */
  doesObjectExist(bucketName: string, key: string): Promise<boolean>;

  /**
   * Lists objects in an S3 bucket, optionally filtered by a prefix.
   * @param bucketName The S3 bucket name.
   * @param prefix Optional prefix to filter objects.
   * @param continuationToken Optional token to continue listing from a previous request.
   * @param maxKeys Optional maximum number of keys to return.
   * @returns A promise resolving to an object containing lists of objects and common prefixes, and a potential continuation token.
   */
  listObjects(
    bucketName: string,
    prefix?: string,
    continuationToken?: string,
    maxKeys?: number,
  ): Promise<ListObjectsOutput>;
}

/**
 * Token for injecting the S3Service.
 */
export const IS3Service = Symbol('IS3Service');
```