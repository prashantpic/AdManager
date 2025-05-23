import { AdSet } from '../../entities/ad-set.entity';

export interface IAdSetRepository {
  findById(id: string): Promise<AdSet | null>; // Merchant scope via campaign
  findByCampaignId(campaignId: string, merchantId: string): Promise<AdSet[]>;
  save(adSet: AdSet): Promise<AdSet>;
  remove(adSet: AdSet): Promise<void>; // Or removeById(id: string)
  // Potentially add findByIdAndMerchantId if ad sets can be fetched directly with merchant scope
  // findByIdAndMerchantId(id: string, merchantId: string): Promise<AdSet | null>;
}

export const IAdSetRepository = Symbol('IAdSetRepository');