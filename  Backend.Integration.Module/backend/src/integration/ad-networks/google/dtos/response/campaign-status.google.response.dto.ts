/**
 * Data Transfer Object for Google Ads campaign status response payload.
 * Defines the structured data received from the Google Ads API regarding a campaign's status.
 */
export class CampaignStatusGoogleResponseDto {
  /**
   * The unique identifier of the campaign in Google Ads.
   */
  campaignId: string;

  /**
   * The administrative status of the campaign (e.g., 'ENABLED', 'PAUSED', 'REMOVED').
   * Refer to Google Ads API documentation for specific enum values.
   */
  status: string;

  /**
   * The serving status of the campaign (e.g., 'SERVING', 'PENDING', 'ENDED', 'LIMITED_BY_BUDGET').
   * This provides more granular information on why a campaign might not be running.
   * Optional, as it may not always be present or relevant.
   */
  servingStatus?: string;

  // Other relevant fields from Google Ads API response can be added here,
  // for example, approval status, policy violations, etc.
}