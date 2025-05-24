import { Injectable } from '@nestjs/common';
import { AppEntity, AppVersionEntity, AppAssetEntity, AppPermissionEntity, AppCategoryEntity, AppRatingReviewEntity, ReviewContent } from '../../domain';
import { AppDto, AppListingDto, AppDetailDto, AppVersionDto, AppAssetDto, AppPermissionDto, AppCategoryDto, AppRatingReviewDto } from '../dtos'; // Assuming DTOs for Asset, Permission, Category, Review exist or are simple
import { AppRatingReviewMapper } from './app-rating-review.mapper';

// Placeholder DTOs if not fully defined elsewhere for brevity
// export class AppAssetDto { id: string; type: string; url: string; altText?: string; }
// export class AppPermissionDto { id: string; permissionName: string; description: string; }
// export class AppCategoryDto { id: string; name: string; description?: string; }


@Injectable()
export class AppMapper {

  constructor(private readonly ratingReviewMapper: AppRatingReviewMapper) {}

  public toDto(entity: AppEntity): AppDto {
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      developerId: entity.developerId,
      developerInfo: entity.developerInfo, // Value Object
      status: entity.status,
      pricingModel: entity.pricingModel,
      pricingDetails: entity.pricingDetails, // Value Object
      categories: entity.categories?.map(c => this.toAppCategoryDto(c)) || [],
      requiredPermissions: entity.requiredPermissions?.map(p => this.toAppPermissionDto(p)) || [],
      averageRating: entity.averageRating, // Assuming this is calculated and stored or passed
      totalRatings: entity.totalRatings,   // Assuming this is calculated and stored or passed
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      latestVersionId: entity.latestVersionId,
    };
  }

  public toListingDto(entity: AppEntity, averageRating?: number): AppListingDto {
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
      shortDescription: entity.description?.substring(0, 100) + (entity.description?.length > 100 ? '...' : ''), // Example short description
      iconUrl: entity.assets?.find(a => a.assetType === 'icon')?.url || null,
      developerName: entity.developerInfo?.name,
      pricingModel: entity.pricingModel,
      averageRating: averageRating !== undefined ? averageRating : entity.averageRating || 0,
      totalRatings: entity.totalRatings || 0,
    };
  }

  public toDetailDto(entity: AppEntity, reviews?: AppRatingReviewEntity[], averageRating?: number): AppDetailDto {
    if (!entity) return null;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      developerId: entity.developerId,
      developerInfo: entity.developerInfo,
      status: entity.status,
      pricingModel: entity.pricingModel,
      pricingDetails: entity.pricingDetails,
      categories: entity.categories?.map(c => this.toAppCategoryDto(c)) || [],
      requiredPermissions: entity.requiredPermissions?.map(p => this.toAppPermissionDto(p)) || [],
      assets: entity.assets?.map(a => this.toAppAssetDto(a)) || [],
      // Assuming latestVersion is eagerly loaded or fetched separately
      latestVersion: entity.latestVersion ? this.toAppVersionDto(entity.latestVersion) : (entity.versions && entity.versions.length > 0 ? this.toAppVersionDto(entity.versions[0]) : null),
      averageRating: averageRating !== undefined ? averageRating : entity.averageRating || 0,
      totalRatings: entity.totalRatings || 0,
      reviews: reviews?.map(r => this.ratingReviewMapper.toDto(r)) || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public toAppVersionDto(entity: AppVersionEntity): AppVersionDto {
    if (!entity) return null;
    return {
      id: entity.id,
      appId: entity.appId,
      versionNumber: entity.versionNumber,
      changelog: entity.changelog,
      packageUrl: entity.packageUrl,
      platformApiVersionCompatibility: entity.platformApiVersionCompatibility,
      submissionDate: entity.submissionDate,
      releaseDate: entity.releaseDate,
      reviewStatus: entity.reviewStatus,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
  
  public toAppAssetDto(entity: AppAssetEntity): AppAssetDto {
    if (!entity) return null;
    return {
        id: entity.id,
        appId: entity.appId,
        type: entity.assetType,
        url: entity.url,
        altText: entity.altText,
        displayOrder: entity.displayOrder,
    };
  }

  public toAppPermissionDto(entity: AppPermissionEntity): AppPermissionDto {
      if (!entity) return null;
      return {
          id: entity.id,
          permissionName: entity.permissionName,
          description: entity.description,
      };
  }

  public toAppCategoryDto(entity: AppCategoryEntity): AppCategoryDto {
      if (!entity) return null;
      return {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          parentCategoryId: entity.parentCategoryId,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
      };
  }
}