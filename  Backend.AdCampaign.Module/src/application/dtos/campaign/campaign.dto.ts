import { CampaignObjective } from '../../../constants/campaign-objective.enum';
import { CampaignStatus } from '../../../constants/campaign-status.enum';
import { BudgetDetailsDto } from '../value-objects/budget-details.dto';
import { ScheduleDetailsDto } from '../value-objects/schedule-details.dto';
import { AdSetDto } from '../ad-set/ad-set.dto';
import { AudienceDto } from '../audience/audience.dto';
import { AdNetworkReferenceDto } from '../value-objects/ad-network-reference.dto';

export class CampaignDto {
  id: string;
  merchantId: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: BudgetDetailsDto;
  schedule: ScheduleDetailsDto;
  audience?: AudienceDto | null; // Could be just audienceId
  audienceId?: string | null;
  adSets: AdSetDto[];
  adNetworkReferences?: AdNetworkReferenceDto[];
  // syncStatus: string; // This might be too complex for a simple DTO, or derived dynamically
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  version: number;
}