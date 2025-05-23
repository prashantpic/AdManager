import { Injectable } from '@nestjs/common';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CreateCampaignDto } from '../dtos/campaign/create-campaign.dto';
import { UpdateCampaignDto } from '../dtos/campaign/update-campaign.dto';
import { CampaignDto } from '../dtos/campaign/campaign.dto';
import { BudgetDetails } from '../../domain/value-objects/budget-details.vo';
import { ScheduleDetails } from '../../domain/value-objects/schedule-details.vo';
import { CampaignName } from '../../domain/value-objects/campaign-name.vo';
import { AdSetMapper } from './ad-set.mapper';
import { AudienceMapper } from './audience.mapper';
import { BudgetDto } from '../dtos/campaign/budget.dto';
import { ScheduleDto } from '../dtos/campaign/schedule.dto';
import { AdNetworkReferenceDto } from '../dtos/sync/ad-network-reference.dto';
import { AdNetworkReference } from '../../domain/value-objects/ad-network-reference.vo';


@Injectable()
export class CampaignMapper {
  constructor(
    private readonly adSetMapper: AdSetMapper,
    private readonly audienceMapper: AudienceMapper,
  ) {}

  toDto(entity: Campaign): CampaignDto {
    const dto = new CampaignDto();
    dto.id = entity.id;
    dto.merchantId = entity.merchantId;
    dto.name = entity.name; // Assuming name is stored as string
    dto.objective = entity.objective;
    dto.status = entity.status;
    
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

    dto.audienceId = entity.targetAudience?.id || null;
    // dto.audience = entity.targetAudience ? this.audienceMapper.toDto(entity.targetAudience) : null;

    dto.adSets = entity.adSets?.map(adSet => this.adSetMapper.toDto(adSet)) || [];
    
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

  // fromCreateDto is more about extracting data for entity construction,
  // actual entity creation is in CampaignFactory.
  // This method helps prepare data for the factory.
  extractCreationData(dto: CreateCampaignDto, merchantId: string): {
    name: string;
    objective: CampaignObjective;
    budgetDetails: BudgetDetails;
    scheduleDetails: ScheduleDetails;
    audienceId?: string;
    merchantId: string;
    adSets?: any[]; // DTO structure for adSets if provided for factory
  } {
    return {
      merchantId,
      name: dto.name,
      objective: dto.objective,
      budgetDetails: new BudgetDetails(
        dto.budget.amount,
        dto.budget.currency,
        dto.budget.type,
        dto.budget.allocationStrategy,
      ),
      scheduleDetails: new ScheduleDetails(
        dto.schedule.startDate,
        dto.schedule.endDate,
        dto.schedule.timeZone,
      ),
      audienceId: dto.audienceId,
      adSets: dto.adSets // Pass through adSet DTOs if factory handles them
    };
  }

  applyUpdateDto(entity: Campaign, dto: UpdateCampaignDto): Campaign {
    if (dto.name !== undefined) {
      entity.name = new CampaignName(dto.name).getValue();
    }
    if (dto.objective !== undefined) {
      entity.objective = dto.objective;
    }
    if (dto.status !== undefined) {
      entity.status = dto.status;
    }
    if (dto.audienceId !== undefined) {
      // Application service would fetch and set the Audience entity
      // Here, we might just update an ID if that's the design,
      // but typically it involves setting the actual related entity.
      // This logic is better handled in the application service.
      // For now, we'll assume the service handles fetching the Audience.
      // If dto.audienceId is null, it means unlinking.
    }

    if (dto.budget && entity.budget) {
      entity.budget.amount = dto.budget.amount ?? entity.budget.amount;
      entity.budget.currency = dto.budget.currency ?? entity.budget.currency;
      entity.budget.type = dto.budget.type ?? entity.budget.type;
      entity.budget.allocationStrategy = dto.budget.allocationStrategy ?? entity.budget.allocationStrategy;
    }

    if (dto.schedule && entity.schedule) {
      entity.schedule.startDate = dto.schedule.startDate ?? entity.schedule.startDate;
      entity.schedule.endDate = dto.schedule.endDate !== undefined ? dto.schedule.endDate : entity.schedule.endDate;
      entity.schedule.timeZone = dto.schedule.timeZone ?? entity.schedule.timeZone;
    }
    
    // Updating adNetworkReferences would be complex and typically part of a sync process
    // rather than a direct DTO update.

    return entity;
  }
}