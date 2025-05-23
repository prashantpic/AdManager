import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from './s3.module';
import { IS3Service, UploadOptions } from './s3.interface'; // Assuming this interface and type exist
import { CoreConfigService } from '../../config/config.service';
import { Readable } from 'stream';

@Injectable()
export class S3Service implements IS3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly defaultSseAlgorithm: ServerSideEncryption;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: CoreConfigService,
  ) {
    this.defaultSseAlgorithm = (this.configService.getS3DefaultSseAlgorithm() ||
      'AES256') as ServerSideEncryption;
  }

  async uploadFile(
    bucketName: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string | Readable,
    options?: UploadOptions,
  ): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      ACL: options?.acl || 'private', // Default to private unless specified
      ServerSideEncryption:
        options?.serverSideEncryption || this.defaultSseAlgorithm,
      Metadata: options?.metadata,
    });

    try {
      const result = await this.s3Client.send(command);
      this.logger.log(`File uploaded to S3: s3://${bucketName}/${key}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error uploading file to S3 (s3://${bucketName}/${key}):`,
        error,
      );
      throw error;
    }
  }

  async downloadFile(
    bucketName: string,
    key: string,
  ): Promise<{
    body: Readable | Blob | undefined;
    contentType: string | undefined;
    contentLength: number | undefined;
    metadata?: Record<string, string>;
  }> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      const result: GetObjectCommandOutput = await this.s3Client.send(command);
      this.logger.log(`File downloaded from S3: s3://${bucketName}/${key}`);
      return {
        body: result.Body as Readable | Blob | undefined, // Type assertion based on expected runtime
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        metadata: result.Metadata,
      };
    } catch (error) {
      this.logger.error(
        `Error downloading file from S3 (s3://${bucketName}/${key}):`,
        error,
      );
      throw error;
    }
  }

  async deleteFile(
    bucketName: string,
    key: string,
  ): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      const result = await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: s3://${bucketName}/${key}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting file from S3 (s3://${bucketName}/${key}):`,
        error,
      );
      throw error;
    }
  }

  async getPresignedUrl(
    bucketName: string,
    key: string,
    expiresInSeconds: number = 3600, // Default to 1 hour
    operation: 'getObject' | 'putObject' = 'getObject',
  ): Promise<string> {
    let command;
    if (operation === 'putObject') {
      command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ServerSideEncryption: this.defaultSseAlgorithm,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
    }

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      this.logger.log(
        `Generated pre-signed URL for ${operation} on s3://${bucketName}/${key}`,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Error generating pre-signed URL for S3 (s3://${bucketName}/${key}):`,
        error,
      );
      throw error;
    }
  }
}