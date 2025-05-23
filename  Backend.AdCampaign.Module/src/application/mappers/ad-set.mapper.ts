import { Injectable } from '@nestjs/common';
import { AdSet } from '../../domain/entities/ad-set.entity';
import { CreateAdSetDto } from '../dtos/ad-set/create-ad-set.dto';
import { UpdateAdSetDto } from '../dtos/ad-set/update-ad-set.dto';
import { AdSetDto } from '../dtos/ad-set/ad-set.dto';
import { AdMapper } from './ad.mapper';
import { AudienceMapper } from './audience.mapper';
import { BudgetDetails } from '../../domain/value-objects/budget-details.vo';
import { ScheduleDetails } from '../../domain/value-objects/schedule-details.vo';
import { BidStrategy } from '../../domain/value-objects/bid-strategy.vo';
import { TargetingParameters } from '../../domain/value-objects/targeting-parameters.vo';
import { BudgetDto } from '../dtos/campaign/budget.dto';
import { ScheduleDto } from '../dtos/campaign/schedule.dto';
import { BidStrategyDto } from '../dtos/ad-set/bid-strategy.dto';
import { TargetingParametersDto } // Assuming this DTO exists
    from '../dtos/audience/targeting-parameters.dto';
import { AdNetworkReferenceDto } from '../dtos/sync/ad-network-reference.dto';


@Injectable()
export class AdSetMapper {
  constructor(
    private readonly adMapper: AdMapper,
    private readonly audienceMapper: AudienceMapper,
  ) {}

  toDto(entity: AdSet): AdSetDto {
    const dto = new AdSetDto();
    dto.id = entity.id;
    dto.campaignId = entity.campaign?.id;
    dto.name = entity.name;
    
    if (entity.budget) {
        dto.budget = new BudgetDto();
        dto.budget.amount = entity.budget.amount;
        dto.budget.currency = entity.budget.currency;
        dto.budget.type = entity.budget.type;
        dto.budget.allocationStrategy = entity.budget.allocationStrategy;
    }
    if (entity.schedule) {
        dto.schedule = new ScheduleDto();
        dto.schedule.startDate = entity.schedule.startDate;
        dto.schedule.endDate = entity.schedule.endDate;
        dto.schedule.timeZone = entity.schedule.timeZone;
    }
    if (entity.bidStrategy) {
        dto.bidStrategy = new BidStrategyDto();
        dto.bidStrategy.type = entity.bidStrategy.type;
        dto.bidStrategy.bidAmount = entity.bidStrategy.bidAmount;
        dto.bidStrategy.targetCpa = entity.bidStrategy.targetCpa;
        dto.bidStrategy.targetRoas = entity.bidStrategy.targetRoas;
    }
    if (entity.targetingParameters) {
        // Assuming TargetingParametersDto matches TargetingParameters structure
        dto.targetingParameters = entity.targetingParameters.getParameters() as TargetingParametersDto;
    }
    
    dto.audienceId = entity.targetAudience?.id || null;
    // dto.targetAudience = entity.targetAudience ? this.audienceMapper.toDto(entity.targetAudience) : null;
    
    dto.ads = entity.ads?.map(ad => this.adMapper.toDto(ad)) || [];
    
    dto.adNetworkReferences = entity.adNetworkReferences?.map(ref => {
        const refDto = new AdNetworkReferenceDto();
        refDto.adNetworkType = ref.adNetworkType;
        refDto.externalId = ref.externalId;
        return refDto;
    }) || [];
    
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  extractCreationData(dto: CreateAdSetDto): {
    name: string;
    budgetDetails?: BudgetDetails;
    scheduleDetails?: ScheduleDetails;
    bidStrategy?: BidStrategy;
    targetingParameters?: TargetingParameters; // Assuming DTO structure matches VO
    targetAudienceId?: string;
    ads?: any[]; // DTO structure for ads if provided
  } {
    return {
      name: dto.name,
      budgetDetails: dto.budget ? new BudgetDetails(dto.budget.amount, dto.budget.currency, dto.budget.type, dto.budget.allocationStrategy) : undefined,
      scheduleDetails: dto.schedule ? new ScheduleDetails(dto.schedule.startDate, dto.schedule.endDate, dto.schedule.timeZone) : undefined,
      bidStrategy: dto.bidStrategy ? new BidStrategy(dto.bidStrategy.type, dto.bidStrategy.bidAmount, dto.bidStrategy.targetCpa, dto.bidStrategy.targetRoas) : undefined,
      targetingParameters: dto.targetingParameters ? new TargetingParameters(dto.targetingParameters) : undefined,
      targetAudienceId: dto.targetAudienceId,
      ads: dto.ads, // Pass through ad DTOs
    };
  }

  applyUpdateDto(entity: AdSet, dto: UpdateAdSetDto): AdSet {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    // Application service handles fetching and setting targetAudience
    if (dto.budget !== undefined && entity.budget) {
        entity.budget.amount = dto.budget.amount ?? entity.budget.amount;
        entity.budget.currency = dto.budget.currency ?? entity.budget.currency;
        entity.budget.type = dto.budget.type ?? entity.budget.type;
        entity.budget.allocationStrategy = dto.budget.allocationStrategy ?? entity.budget.allocationStrategy;
    } else if (dto.budget === null) { // Explicitly remove budget
        entity.budget = undefined;
    }

    if (dto.schedule !== undefined && entity.schedule) {
        entity.schedule.startDate = dto.schedule.startDate ?? entity.schedule.startDate;
        entity.schedule.endDate = dto.schedule.endDate !== undefined ? dto.schedule.endDate : entity.schedule.endDate; // handles null
        entity.schedule.timeZone = dto.schedule.timeZone ?? entity.schedule.timeZone;
    } else if (dto.schedule === null) { // Explicitly remove schedule
        entity.schedule = undefined;
    }


    if (dto.bidStrategy !== undefined) {
      entity.bidStrategy = dto.bidStrategy ? new BidStrategy(dto.bidStrategy.type, dto.bidStrategy.bidAmount, dto.bidStrategy.targetCpa, dto.bidStrategy.targetRoas) : undefined;
    }
    if (dto.targetingParameters !== undefined) {
        entity.targetingParameters = dto.targetingParameters ? new TargetingParameters(dto.targetingParameters) : undefined;
    }
    return entity;
  }
}