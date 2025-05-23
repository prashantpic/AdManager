import { Inject, Injectable } from '@nestjs/common';
import { IAdRepository } from '../interfaces/repositories/ad.repository.interface';
import { IProductCatalogQueryService } from '../interfaces/services/product-catalog-query.interface';
import { IPromotionQueryService } from '../interfaces/services/promotion-query.interface';
import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignCreationException } from '../../exceptions/campaign-creation.exception'; // Or a more specific InvalidLinkException

@Injectable()
export class CampaignAssetLinkerService {
  constructor(
    @Inject('IAdRepository')
    private readonly adRepository: IAdRepository,
    @Inject('IProductCatalogQueryService')
    private readonly productCatalogQueryService: IProductCatalogQueryService,
    @Inject('IPromotionQueryService')
    private readonly promotionQueryService: IPromotionQueryService,
  ) {}

  async linkProductsToAd(
    adId: string,
    merchantId: string,
    productIds: string[],
  ): Promise<void> {
    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    if (productIds.length > 0) {
      const validProductIds =
        await this.productCatalogQueryService.validateProductIds(
          merchantId,
          productIds,
        );
      if (validProductIds.length !== productIds.length) {
        const invalidIds = productIds.filter(id => !validProductIds.includes(id));
        throw new CampaignCreationException( // Or InvalidLinkException
          `Invalid or inaccessible product IDs provided: ${invalidIds.join(', ')}`,
        );
      }
    }
    
    ad.productIds = productIds; // Replace or merge based on requirements
    await this.adRepository.save(ad);
  }

  async linkPromotionsToAd(
    adId: string,
    merchantId: string,
    promotionIds: string[],
  ): Promise<void> {
    const ad = await this.adRepository.findById(adId, merchantId);
    if (!ad) {
      throw new EntityNotFoundException('Ad', adId);
    }

    if (promotionIds.length > 0) {
        const validPromotionIds =
            await this.promotionQueryService.validatePromotionIds(
            merchantId,
            promotionIds,
            );
        if (validPromotionIds.length !== promotionIds.length) {
            const invalidIds = promotionIds.filter(id => !validPromotionIds.includes(id));
            throw new CampaignCreationException( // Or InvalidLinkException
            `Invalid or inaccessible promotion IDs provided: ${invalidIds.join(', ')}`,
            );
        }

        // Additional check for applicability if needed
        for (const promoId of promotionIds) {
            // Context might be ad details, campaign details, or target audience
            const isApplicable = await this.promotionQueryService.validatePromotionApplicability(merchantId, promoId, { adId: ad.id /* ... other context */});
            if (!isApplicable) {
                throw new CampaignCreationException(`Promotion ${promoId} is not applicable to this ad.`);
            }
        }
    }

    ad.promotionIds = promotionIds; // Replace or merge
    await this.adRepository.save(ad);
  }

  async validateProductLinks(productIds: string[], merchantId: string): Promise<void> {
    if (!productIds || productIds.length === 0) return;
    const validProductIds = await this.productCatalogQueryService.validateProductIds(merchantId, productIds);
    if (validProductIds.length !== productIds.length) {
      const invalidIds = productIds.filter(id => !validProductIds.includes(id));
      throw new CampaignCreationException(`Invalid product IDs: ${invalidIds.join(', ')}`);
    }
  }

  async validatePromotionLinks(promotionIds: string[], merchantId: string, context?: any): Promise<void> {
    if (!promotionIds || promotionIds.length === 0) return;
    const validPromotionIds = await this.promotionQueryService.validatePromotionIds(merchantId, promotionIds);
     if (validPromotionIds.length !== promotionIds.length) {
      const invalidIds = promotionIds.filter(id => !validPromotionIds.includes(id));
      throw new CampaignCreationException(`Invalid promotion IDs: ${invalidIds.join(', ')}`);
    }
    if (context) { // If context is provided, check applicability
        for (const promoId of promotionIds) {
            const isApplicable = await this.promotionQueryService.validatePromotionApplicability(merchantId, promoId, context);
            if (!isApplicable) {
                throw new CampaignCreationException(`Promotion ${promoId} is not applicable.`);
            }
        }
    }
  }
}