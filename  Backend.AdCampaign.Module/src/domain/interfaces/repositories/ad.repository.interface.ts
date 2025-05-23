import { Ad } from '../../entities/ad.entity';

export interface IAdRepository {
  findById(id: string): Promise<Ad | null>; // Merchant scope via adSet/campaign
  findByAdSetId(adSetId: string, merchantId: string): Promise<Ad[]>;
  save(ad: Ad): Promise<Ad>;
  remove(ad: Ad): Promise<void>; // Or removeById(id: string)
  // Potentially add findByIdAndMerchantId if ads can be fetched directly with merchant scope
  // findByIdAndMerchantId(id: string, merchantId: string): Promise<Ad | null>;
}

export const IAdRepository = Symbol('IAdRepository');