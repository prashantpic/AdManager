import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Campaign } from '../entities/campaign.entity';
import { AdSet } from '../entities/ad-set.entity';
import { Ad } from '../entities/ad.entity';
import { Budget } from '../entities/budget.entity';
import { Schedule } from '../entities/schedule.entity';
import { Audience } from '../entities/audience.entity';
import { Creative } from '../entities/creative.entity';
import { ICampaignRepository } from '../interfaces/repositories/campaign.repository.interface';
import { IAdSetRepository } from '../interfaces/repositories/ad-set.repository.interface';
import { IAdRepository } from '../interfaces/repositories/ad.repository.interface';
import { IAudienceRepository } from '../interfaces/repositories/audience.repository.interface';
import { ICreativeRepository } from '../interfaces/repositories/creative.repository.interface';
import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { CampaignStatus } from '../../constants';
import { AdNetworkReference } from '../value-objects/ad-network-reference.vo';
import { BidStrategy } from '../value-objects/bid-strategy.vo';
import { AdCreativeContent } from '../value-objects/ad-creative-content.vo';
import { AssetLocation } from '../value-objects/asset-location.vo';
import { TargetingParameters } from '../value-objects/targeting-parameters.vo';


@Injectable()
export class CampaignDuplicatorService {
  constructor(
    @Inject('ICampaignRepository')
    private readonly campaignRepository: ICampaignRepository,
    @Inject('IAdSetRepository')
    private readonly adSetRepository: IAdSetRepository,
    @Inject('IAdRepository')
    private readonly adRepository: IAdRepository,
    @Inject('IAudienceRepository')
    private readonly audienceRepository: IAudienceRepository,
    @Inject('ICreativeRepository')
    private readonly creativeRepository: ICreativeRepository,
  ) {}

  private cloneBudget(original?: Budget): Budget | undefined {
    if (!original) return undefined;
    const newBudget = new Budget();
    newBudget.id = uuidv4();
    newBudget.amount = original.amount;
    newBudget.currency = original.currency;
    newBudget.type = original.type;
    newBudget.allocationStrategy = original.allocationStrategy;
    return newBudget;
  }

  private cloneSchedule(original?: Schedule): Schedule | undefined {
    if (!original) return undefined;
    const newSchedule = new Schedule();
    newSchedule.id = uuidv4();
    newSchedule.startDate = new Date(original.startDate); // Create new Date objects
    newSchedule.endDate = original.endDate ? new Date(original.endDate) : null;
    newSchedule.timeZone = original.timeZone;
    return newSchedule;
  }

  private async cloneAudience(original?: Audience, merchantId?: string): Promise<Audience | undefined> {
    if (!original || !merchantId) return undefined;
    // For audiences, we create a new one as they are merchant-specific aggregates
    const newAudience = new Audience();
    newAudience.id = uuidv4();
    newAudience.merchantId = merchantId;
    newAudience.name = `Copy of ${original.name} - ${uuidv4().substring(0, 4)}`;
    newAudience.description = original.description;
    // Deep copy targeting parameters if it's a complex object
    newAudience.targetingParameters = original.targetingParameters 
        ? new TargetingParameters(JSON.parse(JSON.stringify(original.targetingParameters.getParameters()))) 
        : new TargetingParameters({});
    // We don't save it here, it will be cascade saved with the campaign or adSet
    return newAudience;
  }

  private async cloneCreative(original?: Creative, merchantId?: string): Promise<Creative | undefined> {
    if (!original || !merchantId) return undefined;
    // Creatives might be shared or duplicated. SDS says "deep copy... Creatives".
    const newCreative = new Creative();
    newCreative.id = uuidv4();
    newCreative.merchantId = merchantId;
    newCreative.name = `Copy of ${original.name} - ${uuidv4().substring(0, 4)}`;
    newCreative.type = original.type;
    newCreative.assetLocation = original.assetLocation 
        ? new AssetLocation(original.assetLocation.storageType, original.assetLocation.uri) 
        : undefined;
    newCreative.content = original.content 
        ? new AdCreativeContent(original.content.headline, original.content.description, original.content.bodyText, original.content.callToActionText) 
        : undefined;
    // We don't save it here, it will be cascade saved if linked to an Ad
    return newCreative;
  }


  async duplicateCampaign(
    originalCampaignId: string,
    merchantId: string,
  ): Promise<Campaign> {
    const originalCampaign = await this.campaignRepository.findById(
      originalCampaignId,
      merchantId,
    );
    if (!originalCampaign) {
      throw new EntityNotFoundException('Campaign', originalCampaignId);
    }

    const newCampaign = new Campaign();
    newCampaign.id = uuidv4();
    newCampaign.merchantId = merchantId;
    newCampaign.name = `Copy of ${originalCampaign.name}`;
    newCampaign.objective = originalCampaign.objective;
    newCampaign.status = CampaignStatus.DRAFT; // Reset status
    newCampaign.budget = this.cloneBudget(originalCampaign.budget);
    newCampaign.schedule = this.cloneSchedule(originalCampaign.schedule);
    
    if (originalCampaign.targetAudience) {
        newCampaign.targetAudience = await this.cloneAudience(originalCampaign.targetAudience, merchantId);
    }

    newCampaign.adNetworkReferences = []; // Reset external references
    newCampaign.syncLogs = []; // Reset sync logs

    newCampaign.adSets = [];
    if (originalCampaign.adSets && originalCampaign.adSets.length > 0) {
      for (const originalAdSet of originalCampaign.adSets) {
        const newAdSet = new AdSet();
        newAdSet.id = uuidv4();
        newAdSet.campaign = newCampaign;
        newAdSet.name = `Copy of ${originalAdSet.name}`;
        newAdSet.budget = this.cloneBudget(originalAdSet.budget);
        newAdSet.schedule = this.cloneSchedule(originalAdSet.schedule);
        
        if (originalAdSet.bidStrategy) {
             newAdSet.bidStrategy = new BidStrategy(originalAdSet.bidStrategy.type, originalAdSet.bidStrategy.bidAmount, originalAdSet.bidStrategy.targetCpa, originalAdSet.bidStrategy.targetRoas);
        }
        if (originalAdSet.targetAudience) { // AdSets can have their own audience
             newAdSet.targetAudience = await this.cloneAudience(originalAdSet.targetAudience, merchantId);
        } else if (newCampaign.targetAudience) { // Or inherit from campaign
             // newAdSet.targetAudience = newCampaign.targetAudience; // This would share the campaign's new audience
        }
        // If AdSet has its own TargetingParameters, clone them
        if (originalAdSet.targetingParameters) {
            newAdSet.targetingParameters = new TargetingParameters(JSON.parse(JSON.stringify(originalAdSet.targetingParameters.getParameters())));
        }


        newAdSet.adNetworkReferences = [];
        newAdSet.ads = [];
        if (originalAdSet.ads && originalAdSet.ads.length > 0) {
          for (const originalAd of originalAdSet.ads) {
            const newAd = new Ad();
            newAd.id = uuidv4();
            newAd.adSet = newAdSet;
            newAd.name = `Copy of ${originalAd.name}`;
            if (originalAd.creative) {
                newAd.creative = await this.cloneCreative(originalAd.creative, merchantId);
            }
            newAd.productIds = [...(originalAd.productIds || [])];
            newAd.promotionIds = [...(originalAd.promotionIds || [])];
            newAd.creativeType = originalAd.creativeType;
            if (originalAd.creativeContent) {
                newAd.creativeContent = new AdCreativeContent(originalAd.creativeContent.headline, originalAd.creativeContent.description, originalAd.creativeContent.bodyText, originalAd.creativeContent.callToActionText);
            }
            newAd.adNetworkReferences = [];
            newAdSet.ads.push(newAd);
          }
        }
        newCampaign.adSets.push(newAdSet);
      }
    }
    return this.campaignRepository.save(newCampaign); // This should cascade save everything
  }

  // duplicateAdSet and duplicateAd would follow similar patterns,
  // fetching the original, creating new instances, copying relevant data,
  // resetting IDs/references, and saving. They would need targetCampaignId/targetAdSetId.
  // For brevity, only duplicateCampaign is fully implemented here.
}