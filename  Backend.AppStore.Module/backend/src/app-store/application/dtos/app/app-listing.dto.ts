import { AppPricingModel } from '../../../common/enums/app-pricing-model.enum';

export class AppListingDto {
  id: string;
  name: string;
  shortDescription: string;
  iconUrl?: string;
  developerName: string;
  pricingModel: AppPricingModel;
  averageRating?: number;
  totalRatings?: number;
  // Potentially a category hint
}