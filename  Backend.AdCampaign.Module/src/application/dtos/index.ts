// Campaign DTOs
export * from './campaign/create-campaign.dto';
export * from './campaign/update-campaign.dto';
export * from './campaign/campaign.dto';
export * from './campaign/budget.dto'; // Assuming BudgetDto exists for CampaignDto
export * from './campaign/schedule.dto'; // Assuming ScheduleDto exists for CampaignDto

// AdSet DTOs
export * from './ad-set/create-ad-set.dto';
export * from './ad-set/update-ad-set.dto';
export * from './ad-set/ad-set.dto';
export * from './ad-set/bid-strategy.dto'; // Assuming BidStrategyDto exists

// Ad DTOs
export * from './ad/create-ad.dto';
export * from './ad/update-ad.dto';
export * from './ad/ad.dto';
export * from './ad/ad-creative-content.dto'; // Assuming AdCreativeContentDto exists

// Audience DTOs
export * from './audience/define-audience.dto';
export * from './audience/audience.dto';
export * from './audience/targeting-parameters.dto'; // Assuming TargetingParametersDto exists

// Creative DTOs
export * from './creative/associate-creative.dto';
export * from './creative/creative.dto';
export * from './creative/upload-creative-asset.dto';
export * from './creative/asset-location.dto'; // Assuming AssetLocationDto exists

// Sync DTOs
export * from './sync/campaign-sync-log.dto';
export * from './sync/ad-network-reference.dto'; // Assuming AdNetworkReferenceDto exists