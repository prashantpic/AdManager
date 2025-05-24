import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';
import { AppStatus } from '../../../common/enums/app-status.enum';
import { AppPricingDto, DeveloperInfoDto } from './create-app.dto';
import { AppVersionDto } from '../app-version/app-version.dto';
import { AppRatingReviewDto } from '../rating-review/app-rating-review.dto';
import { AppCategorySummaryDto, AppPermissionSummaryDto } from './app.dto';


export class AppAssetDto {
  id: string;
  type: string; // 'icon', 'screenshot'
  url: string;
  altText?: string;
}
export class AppDetailDto {
  id: string;
  name: string;
  description: string;
  longDescription?: string; // If available
  developerId: string;
  developerInfo: DeveloperInfoDto;
  status: AppStatus;
  pricingModel: AppPricingModel;
  pricingDetails?: AppPricingDto;
  requiredPermissions?: AppPermissionSummaryDto[];
  categories?: AppCategorySummaryDto[];
  assets?: AppAssetDto[];
  latestVersion?: AppVersionDto; // Or a list of all published versions
  averageRating?: number;
  totalRatings?: number;
  reviews?: AppRatingReviewDto[]; // Paginated list of reviews
  supportUrl?: string;
  documentationUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}