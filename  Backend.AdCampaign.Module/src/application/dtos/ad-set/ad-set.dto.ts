import { BudgetDetailsDto } from '../value-objects/budget-details.dto';
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto';
import { BidStrategyDto } from '../value-objects/bid-strategy.dto';
import { TargetingParametersDto } from '../value-objects/targeting-parameters.dto';
import { AudienceDto } from '../audience/audience.dto';
import { AdDto } from '../ad/ad.dto';
import { AdNetworkReferenceDto } from '../value-objects/ad-network-reference.dto';

export class AdSetDto {
  id: string;
  name: string;
  campaignId: string;
  targetAudience?: AudienceDto | null;
  audienceId?: string | null;
  targetingParameters?: TargetingParametersDto | null;
  budget?: BudgetDetailsDto | null;
  schedule?: ScheduleDetailsDto | null;
  bidStrategy?: BidStrategyDto | null;
  ads: AdDto[];
  adNetworkReferences?: AdNetworkReferenceDto[];
  createdAt: Date;
  updatedAt: Date;
}