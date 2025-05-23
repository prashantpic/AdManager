import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IS3Service, UploadOptions } from './s3.interface';
import { S3_CLIENT_TOKEN } from './s3.module';
import { CoreConfigService } from '../../config/config.service';
import { Readable } from 'stream';

@Injectable()
export class S3Service implements IS3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly defaultSseAlgorithm: ServerSideEncryption | undefined;

  constructor(
    @Inject(S3_CLIENT_TOKEN) private readonly s3Client: S3Client,
    private readonly configService: CoreConfigService,
  ) {
    const sseAlgo = this.configService.getS3DefaultSseAlgorithm();
    if (sseAlgo && Object.values(ServerSideEncryption).includes(sseAlgo as ServerSideEncryption)) {
        this.defaultSseAlgorithm = sseAlgo as ServerSideEncryption;
    }
  }

  async uploadFile(
    bucketName: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string | Readable,
    options?: UploadOptions,
  ): Promise<PutObjectCommandOutput> {
    const params: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      ACL: options?.acl,
      Metadata: options?.metadata,
      ServerSideEncryption: this.defaultSseAlgorithm || options?.serverSideEncryption,
    };

    if (params.ServerSideEncryption === ServerSideEncryption.AWS_KMS && options?.kmsKeyId) {
        params.SSEKMSKeyId = options.kmsKeyId;
    }


    try {
      const command = new PutObjectCommand(params);
      const result = await this.s3Client.send(command);
      this.logger.log(`File uploaded to S3: s3://${bucketName}/${key}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error uploading file to S3: s3://${bucketName}/${key}`,
        error.stack,
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
    const params: GetObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const result: GetObjectCommandOutput = await this.s3Client.send(command);
      this.logger.log(`File downloaded from S3: s3://${bucketName}/${key}`);
      return {
        body: result.Body as Readable | Blob | undefined, // Type assertion based on environment (Node.js vs Browser)
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        metadata: result.Metadata,
      };
    } catch (error) {
      this.logger.error(
        `Error downloading file from S3: s3://${bucketName}/${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFile(
    bucketName: string,
    key: string,
  ): Promise<DeleteObjectCommandOutput> {
    const params: DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      const result = await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: s3://${bucketName}/${key}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting file from S3: s3://${bucketName}/${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPresignedUrl(
    bucketName: string,
    key: string,
    operation: 'getObject' | 'putObject' = 'getObject',
    expiresInSeconds: number = 3600, // Default to 1 hour
  ): Promise<string> {
    
    let command;
    if (operation === 'putObject') {
        const putParams: PutObjectCommandInput = { Bucket: bucketName, Key: key };
        if (this.defaultSseAlgorithm) {
            putParams.ServerSideEncryption = this.defaultSseAlgorithm;
        }
        command = new PutObjectCommand(putParams);
    } else {
        command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    }

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      this.logger.log(
        `Generated pre-signed URL for S3: s3://${bucketName}/${key}, operation: ${operation}`,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Error generating pre-signed URL for S3: s3://${bucketName}/${key}`,
        error.stack,
      );
      throw error;
    }
  }
}