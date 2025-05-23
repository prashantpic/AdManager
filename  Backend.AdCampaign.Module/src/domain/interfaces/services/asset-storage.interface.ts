import { AssetLocation } from '../../value-objects/asset-location.vo';

export interface FileUploadMetadata {
  filename: string;
  contentType: string;
  size: number;
  // any other relevant metadata
}

// Could be a Buffer, Stream, or path to a temp file
export type FileInput = Buffer | NodeJS.ReadableStream;


export interface IAssetStorageService {
  uploadAsset(
    merchantId: string,
    fileInput: FileInput,
    metadata: FileUploadMetadata,
    // Optional path prefix or category
    // pathPrefix?: string,
  ): Promise<AssetLocation>;

  getAssetUrl(location: AssetLocation): Promise<string>; // Might be part of AssetLocation VO itself

  deleteAsset(location: AssetLocation): Promise<void>;
}

export const IAssetStorageService = Symbol('IAssetStorageService');