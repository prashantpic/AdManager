import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for Google Ads campaign creation request payload.
 * Defines the structure expected by the Google Ads API for creating a new campaign.
 */
export class CreateCampaignGoogleRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Example statuses: 'ENABLED', 'PAUSED', 'REMOVED'.
   * Refer to Google Ads API documentation for valid enum values.
   */
  @IsString()
  @IsNotEmpty()
  status: string; // e.g., 'ENABLED', 'PAUSED'

  /**
   * The resource name of the budget to attach to this campaign.
   * Example: "customers/{customer_id}/campaignBudgets/{budget_id}"
   */
  @IsString()
  @IsNotEmpty()
  budgetId: string; // Or budget resource name

  /**
   * Object containing various targeting criteria for the campaign.
   * The structure of this object is highly dependent on the Google Ads API version
   * and campaign type. Examples: geo targets, demographics, keywords.
   * Mapped by GoogleAdsMapper.
   */
  @IsObject()
  @IsOptional()
  targetingCriteria?: any; // This should be a more specific type based on Google Ads API
}