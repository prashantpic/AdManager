import { Campaign } from '../../entities/campaign.entity';
import { CampaignStatus } from '../../../constants/campaign-status.enum';
import { CampaignObjective } from '../../../constants/campaign-objective.enum';

export interface FindAllCampaignsFilters {
  status?: CampaignStatus;
  objective?: CampaignObjective;
  // Add other potential filter fields, e.g., date ranges
}

export interface ICampaignRepository {
  findById(id: string, merchantId: string): Promise<Campaign | null>;
  findAll(
    merchantId: string,
    filters?: FindAllCampaignsFilters,
    // paginationOptions?: any, // Consider adding pagination
  ): Promise<Campaign[]>;
  save(campaign: Campaign): Promise<Campaign>;
  remove(campaign: Campaign): Promise<void>; // Or removeById(id: string, merchantId: string)
  // Example of a more specific query
  // findByStatus(merchantId: string, status: CampaignStatus): Promise<Campaign[]>;
}

export const ICampaignRepository = Symbol('ICampaignRepository');