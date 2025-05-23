import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Campaign } from '../entities/campaign.entity';
import { Budget } from '../entities/budget.entity';
import { Schedule } from '../entities/schedule.entity';
import { Audience } from '../entities/audience.entity';
import { CampaignObjective, CampaignStatus } from '../../constants';
import { BudgetDetails } from '../value-objects/budget-details.vo';
import { ScheduleDetails } from '../value-objects/schedule-details.vo';
import { CampaignName } from '../value-objects/campaign-name.vo';
import { IAudienceRepository } from '../interfaces/repositories/audience.repository.interface';
import { CampaignCreatedEvent } from '../events/campaign-created.event';
import { CreateCampaignDto } from '../../application/dtos/campaign/create-campaign.dto'; // For data structure reference
import { AdSet } from '../entities/ad-set.entity';
import { CreateAdSetDto } from '../../application/dtos/ad-set/create-ad-set.dto';
import { Ad } from '../entities/ad.entity';
import { CreateAdDto } from '../../application/dtos/ad/create-ad.dto';
import { BidStrategy } from '../value-objects/bid-strategy.vo';
import { AdCreativeContent } from '../value-objects/ad-creative-content.vo';

@Injectable()
export class CampaignFactory {
  constructor(
    @Inject('IAudienceRepository')
    private readonly audienceRepository: IAudienceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async createCampaign(
    data: {
      name: string;
      objective: CampaignObjective;
      budgetDetails: BudgetDetails;
      scheduleDetails: ScheduleDetails;
      audienceId?: string;
      adSets?: CreateAdSetDto[]; // Using DTO for structure, factory will convert to entities
    },
    merchantId: string,
  ): Promise<Campaign> {
    const campaignName = new CampaignName(data.name);

    const budget = new Budget();
    budget.amount = data.budgetDetails.amount;
    budget.currency = data.budgetDetails.currency;
    budget.type = data.budgetDetails.type;
    budget.allocationStrategy = data.budgetDetails.allocationStrategy;

    const schedule = new Schedule();
    schedule.startDate = data.scheduleDetails.startDate;
    schedule.endDate = data.scheduleDetails.endDate;
    schedule.timeZone = data.scheduleDetails.timeZone;

    const campaign = new Campaign();
    campaign.merchantId = merchantId;
    campaign.name = campaignName.getValue(); // Storing primitive string, VO validated on construction
    campaign.objective = data.objective;
    campaign.status = CampaignStatus.DRAFT;
    campaign.budget = budget;
    campaign.schedule = schedule;

    if (data.audienceId) {
      const audience = await this.audienceRepository.findById(
        data.audienceId,
        merchantId,
      );
      if (audience) {
        campaign.targetAudience = audience;
      }
      // Optionally throw error if audience not found, or proceed without
    }
    
    campaign.adSets = [];
    if (data.adSets && data.adSets.length > 0) {
        for (const adSetDto of data.adSets) {
            const adSet = new AdSet();
            adSet.name = adSetDto.name;
            adSet.campaign = campaign; // Link back to campaign

            if (adSetDto.budget) {
                const adSetBudget = new Budget();
                adSetBudget.amount = adSetDto.budget.amount;
                adSetBudget.currency = adSetDto.budget.currency;
                adSetBudget.type = adSetDto.budget.type;
                adSetBudget.allocationStrategy = adSetDto.budget.allocationStrategy;
                adSet.budget = adSetBudget;
            }

            if (adSetDto.schedule) {
                const adSetSchedule = new Schedule();
                adSetSchedule.startDate = adSetDto.schedule.startDate;
                adSetSchedule.endDate = adSetDto.schedule.endDate;
                adSetSchedule.timeZone = adSetDto.schedule.timeZone;
                adSet.schedule = adSetSchedule;
            }
            
            if (adSetDto.bidStrategy) {
                 adSet.bidStrategy = new BidStrategy(adSetDto.bidStrategy.type, adSetDto.bidStrategy.bidAmount, adSetDto.bidStrategy.targetCpa, adSetDto.bidStrategy.targetRoas);
            }

            // TODO: Add TargetingParameters mapping for AdSet if DTO contains it.
            // adSet.targetingParameters = new TargetingParameters(...);


            adSet.ads = [];
            if (adSetDto.ads && adSetDto.ads.length > 0) {
                for (const adDto of adSetDto.ads as CreateAdDto[]) { // Assuming CreateAdDto structure
                    const ad = new Ad();
                    ad.name = adDto.name;
                    ad.adSet = adSet; // Link back to adSet
                    // ad.creativeId = adDto.creativeId; // Link creative if ID provided
                    ad.productIds = adDto.productIds || [];
                    ad.promotionIds = adDto.promotionIds || [];
                    if(adDto.creativeContent){
                         ad.creativeContent = new AdCreativeContent(adDto.creativeContent.headline, adDto.creativeContent.description, adDto.creativeContent.bodyText, adDto.creativeContent.callToActionText);
                    }
                    // ad.creativeType = adDto.creativeType;
                    adSet.ads.push(ad);
                }
            }
            campaign.adSets.push(adSet);
        }
    }


    this.eventBus.publish(
      new CampaignCreatedEvent(campaign.id, merchantId, campaign.objective),
    );

    return campaign;
  }
}