import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';
import { AppStatus } from '../../../common/enums/app-status.enum';
import { AppPricingDto, DeveloperInfoDto } from './create-app.dto'; // Reusing for structure

// Simplified DTOs for nested structures in AppDto
export class AppPermissionSummaryDto {
  id: string;
  name: string;
}

export class AppCategorySummaryDto {
  id: string;
  name: string;
}

export class AppDto {
  id: string;
  name: string;
  description: string;
  developerId: string;
  status: AppStatus;
  pricingModel: AppPricingModel;
  pricingDetails?: AppPricingDto;
  developerInfo: DeveloperInfoDto;
  requiredPermissions?: AppPermissionSummaryDto[];
  categories?: AppCategorySummaryDto[];
  createdAt: Date;
  updatedAt: Date;
  // Potentially other fields like averageRating, totalReviews, iconUrl
}