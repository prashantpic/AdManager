import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export type AssetStorageType = 'S3' | 'EXTERNAL_URL';

export class AssetLocation {
  public readonly storageType: AssetStorageType;
  public readonly uri: string; // e.g., 's3://bucket-name/path/to/asset.jpg' or 'https://example.com/image.png'

  constructor(storageType: AssetStorageType, uri: string) {
    if (!storageType || (storageType !== 'S3' && storageType !== 'EXTERNAL_URL')) {
      throw new ArgumentInvalidException('Asset storage type must be "S3" or "EXTERNAL_URL".');
    }
    if (!uri || uri.trim().length === 0) {
      throw new ArgumentInvalidException('Asset URI cannot be empty.');
    }

    if (storageType === 'S3') {
      // Basic S3 URI validation
      if (!uri.startsWith('s3://')) {
        throw new ArgumentInvalidException('S3 URI must start with "s3://".');
      }
    } else if (storageType === 'EXTERNAL_URL') {
      // Basic URL validation
      try {
        new URL(uri);
      } catch (error) {
        throw new ArgumentInvalidException('Invalid external URL format for asset location.');
      }
    }

    this.storageType = storageType;
    this.uri = uri;
  }
  // Getter methods can be added
}