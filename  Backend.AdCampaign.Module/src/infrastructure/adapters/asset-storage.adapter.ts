import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetStorageService } from '../../domain/interfaces/services/asset-storage.interface';
import { AssetLocation } from '../../domain/value-objects/asset-location.vo';
// Assuming a CoreModule provides an S3Service
// import { S3Service } from 'path-to-core-module/s3.service';
import { v4 as uuidv4 } from 'uuid';

// Placeholder S3Service if not injected from CoreModule
class PlaceholderS3Service {
    private readonly logger = new Logger(PlaceholderS3Service.name);
    async upload(bucket: string, key: string, body: Buffer, contentType: string): Promise<{ Location: string, ETag: string }> {
        this.logger.log(`Mock S3 Upload: bucket=${bucket}, key=${key}, contentType=${contentType}, size=${body.length}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        return { Location: `https://${bucket}.s3.amazonaws.com/${key}`, ETag: `"${uuidv4()}"` };
    }
    async getSignedUrl(bucket: string, key: string): Promise<string> {
        this.logger.log(`Mock S3 GetSignedUrl: bucket=${bucket}, key=${key}`);
        return `https://${bucket}.s3.amazonaws.com/${key}?signed=true&expires=3600`;
    }
    async deleteObject(bucket: string, key: string): Promise<void> {
        this.logger.log(`Mock S3 DeleteObject: bucket=${bucket}, key=${key}`);
    }
}


@Injectable()
export class AssetStorageAdapter implements IAssetStorageService {
  private readonly logger = new Logger(AssetStorageAdapter.name);
  private readonly creativeAssetBucket = 'admanager-creative-assets'; // Example bucket name

  constructor(
    // @Inject(S3Service) private readonly s3Service: S3Service,
    // Using placeholder for now
    private readonly s3Service: PlaceholderS3Service = new PlaceholderS3Service(),
  ) {}

  async uploadAsset(
    merchantId: string,
    file: Express.Multer.File, // Assuming Multer is used for file uploads
    // metadata?: any, // SDS has file: any, metadata?:any. Assuming file is Express.Multer.File
  ): Promise<AssetLocation> {
    this.logger.log(
      `Uploading asset for merchant ${merchantId}: ${file.originalname}`,
    );
    
    const fileExtension = file.originalname.split('.').pop() || '';
    const key = `merchants/${merchantId}/creatives/${uuidv4()}.${fileExtension}`;

    try {
      const s3Response = await this.s3Service.upload(
        this.creativeAssetBucket,
        key,
        file.buffer,
        file.mimetype,
      );
      return new AssetLocation('S3', s3Response.Location); // Using Location as URI
    } catch (error) {
      this.logger.error(`Failed to upload asset for merchant ${merchantId}: ${error.message}`, error.stack);
      throw new Error(`Asset upload failed: ${error.message}`); // Or custom CreativeAssetUploadException
    }
  }

  async getAssetUrl(location: AssetLocation): Promise<string> {
    if (location.storageType === 'S3') {
      // URI from S3 upload is usually the public URL or a pre-signed URL if bucket is private
      // For simplicity, if URI is already a full URL, return it.
      // If it's just a key, then generate a signed URL.
      // Assuming location.uri IS the accessible URL.
      // If it was just bucket/key, it would be:
      // const [bucket, ...keyParts] = location.uri.split('/');
      // const key = keyParts.join('/');
      // return this.s3Service.getSignedUrl(bucket, key);
      return location.uri; 
    } else if (location.storageType === 'EXTERNAL_URL') {
      return location.uri;
    }
    throw new Error(`Unsupported asset storage type: ${location.storageType}`);
  }

  async deleteAsset(location: AssetLocation): Promise<void> {
    if (location.storageType === 'S3') {
        // Need to parse bucket and key from URI if URI is the full S3 URL
        // Example: https://admanager-creative-assets.s3.amazonaws.com/merchants/merchantId/creatives/uuid.jpg
        try {
            const url = new URL(location.uri);
            const bucket = url.hostname.split('.')[0];
            const key = url.pathname.substring(1); // remove leading '/'
            
            if (bucket !== this.creativeAssetBucket) { // Basic validation
                this.logger.warn(`Attempt to delete asset from unexpected bucket: ${bucket}`);
                throw new Error('Invalid asset location for deletion.');
            }
            await this.s3Service.deleteObject(bucket, key);
            this.logger.log(`Deleted asset from S3: ${location.uri}`);
        } catch (error) {
            this.logger.error(`Failed to parse S3 URI or delete asset ${location.uri}: ${error.message}`, error.stack);
            throw new Error(`Asset deletion failed: ${error.message}`);
        }
    } else {
      this.logger.warn(
        `Deletion not supported for storage type: ${location.storageType}`,
      );
      // Or throw an error if deletion is expected for all types
    }
  }
}