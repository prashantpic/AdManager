import { FeatureKey } from '../constants/feature.constants';

export class FeatureAccessResponseDto {
  featureKey: FeatureKey;
  hasAccess: boolean;
  isWithinLimit?: boolean;
  limit?: number;
  currentUsage?: number;
  requestedUsage?: number;
  isGracePeriod?: boolean;
  gracePeriodEndDate?: Date;
  message?: string;
  errorCode?: string; // e.g., 'LIMIT_EXCEEDED', 'FEATURE_NOT_AVAILABLE'
}