import { Injectable, Logger } from '@nestjs/common';
// Assume S3Service is provided by a CoreModule, e.g. @admanager/backend-core
// import { S3Service } from '@admanager/backend-core';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"; // Using AWS SDK v3
import { ConfigService } from '@nestjs/config';

// Placeholder for Core S3 Service if a higher-level abstraction is used.
// For now, directly using S3Client as an example.
interface CoreS3Service {
  upload(bucket: string, key: string, body: Buffer | string, contentType: string): Promise<{ url: string; key: string }>;
  getSignedUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
}


export namespace AdManager.Platform.Backend.ProductCatalog.Infrastructure.Adapters {
  /**
   * Adapter for S3 interactions related to product catalog feeds.
   * Handles the storage of generated product catalog feeds into AWS S3.
   * @version 1.0.0
   * @stability Production
   */
  @Injectable()
  export class ProductCatalogS3Adapter {
    private readonly logger = new Logger(ProductCatalogS3Adapter.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(
      // Option 1: Inject a pre-configured S3 client or a higher-level S3 service from CoreModule
      // private readonly coreS3Service: CoreS3Service,
      private readonly configService: ConfigService,
    ) {
      // Option 2: Initialize S3 client directly if CoreS3Service is not available/suitable
      this.s3Client = new S3Client({
        region: this.configService.get<string>('AWS_REGION'),
        // Credentials should be handled by the environment (e.g., IAM role for ECS task)
      });
      this.bucketName = this.configService.get<string>('PRODUCT_CATALOG_S3_BUCKET_NAME');
      if (!this.bucketName) {
        throw new Error('PRODUCT_CATALOG_S3_BUCKET_NAME is not configured.');
      }
    }

    /**
     * Uploads a feed content to a structured S3 path and returns its S3 URL.
     * @param feedContent The string content of the feed.
     * @param fileName The desired file name (e.g., 'feed.csv', 'google_feed.xml').
     * @param contentType The MIME type of the feed ('text/csv', 'application/xml').
     * @param merchantId The ID of the merchant.
     * @param catalogId The ID of the catalog.
     * @returns Promise<string> The public or pre-signed URL of the uploaded feed.
     */
    async uploadFeed(
      feedContent: string,
      fileName: string,
      contentType: 'text/csv' | 'application/xml' | string,
      merchantId: string,
      catalogId: string,
    ): Promise<string> {
      const key = `feeds/${merchantId}/${catalogId}/${Date.now()}_${fileName}`;
      this.logger.log(`Uploading feed to S3: bucket='${this.bucketName}', key='${key}'`);

      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: feedContent,
          ContentType: contentType,
          // ACL: 'public-read', // Or manage via bucket policy for more secure access
        });

        await this.s3Client.send(command);
        
        // Construct the S3 URL (ensure bucket is configured for public access or use signed URLs)
        // This URL format might vary based on region and bucket settings.
        const s3ObjectUrl = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
        this.logger.log(`Feed uploaded successfully to S3. URL: ${s3ObjectUrl}`);
        return s3ObjectUrl;

        // If using a CoreS3Service:
        // const result = await this.coreS3Service.upload(this.bucketName, key, feedContent, contentType);
        // return result.url;

      } catch (error) {
        this.logger.error(`Failed to upload feed to S3. Key: ${key}, Error: ${error.message}`, error.stack);
        throw error; // Re-throw to be handled by the service layer
      }
    }
  }
}