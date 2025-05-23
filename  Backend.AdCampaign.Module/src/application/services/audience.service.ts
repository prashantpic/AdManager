import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Audience } from '../../domain/entities/audience.entity';
import { IAudienceRepository } from '../../domain/interfaces/repositories/audience.repository.interface';
import { IUserContextProvider } from '../../domain/interfaces/services/user-context-provider.interface';
import { AudienceMapper } from '../mappers/audience.mapper';
import { DefineAudienceDto } from '../dtos/audience/define-audience.dto';
import { AudienceDto } from '../dtos/audience/audience.dto';
import { EntityNotFoundException } from '../../exceptions/entity-not-found.exception';
import { InvalidAudienceDataException } from '../../exceptions/invalid-audience-data.exception';
import { IEntitlementValidationService } from '../../domain/interfaces/services/entitlement-validation.interface';
import { CampaignLimitException } from '../../exceptions/campaign-limit.exception';

@Injectable()
export class AudienceService {
  constructor(
    @Inject(IAudienceRepository) private readonly audienceRepository: IAudienceRepository,
    @Inject(IUserContextProvider) private readonly userContextProvider: IUserContextProvider,
    @Inject(IEntitlementValidationService) private readonly entitlementService: IEntitlementValidationService,
    private readonly audienceMapper: AudienceMapper,
  ) {}

  async createAudience(defineAudienceDto: DefineAudienceDto): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();

    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'CUSTOM_AUDIENCES')) {
        throw new CampaignLimitException('Custom audience creation is not available for your plan.');
    }
    const audienceCount = await this.audienceRepository.countByMerchantId(merchantId); // Assuming this method exists
    if (!await this.entitlementService.checkUsageLimit(merchantId, 'MAX_CUSTOM_AUDIENCES', audienceCount)) {
        throw new CampaignLimitException('Maximum number of custom audiences reached.');
    }
    // Validate TargetingParameters VO within the DTO (handled by class-validator or a domain validator)
    // For example, specific fields might be restricted based on subscription.
    // This basic validation is done at DTO level, deeper validation in domain service if needed.
    try {
        const audience = this.audienceMapper.fromDefineDto(defineAudienceDto, merchantId);
        // audience.validateTargetingParameters(); // Assuming a method on the entity or VO
        const savedAudience = await this.audienceRepository.save(audience);
        return this.audienceMapper.toDto(savedAudience);
    } catch (error) {
        // Catch specific validation errors from VOs if they throw custom errors
        if (error.name === 'ValidationError') { // Example, depends on VO implementation
             throw new InvalidAudienceDataException(`Invalid targeting parameters: ${error.message}`);
        }
        throw error; // Re-throw other errors
    }
  }

  async getAudienceById(audienceId: string): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    const audience = await this.audienceRepository.findById(audienceId, merchantId);
    if (!audience) {
      throw new EntityNotFoundException('Audience', audienceId);
    }
    return this.audienceMapper.toDto(audience);
  }

  async getAudiencesByMerchantId(): Promise<AudienceDto[]> {
    const merchantId = this.userContextProvider.getMerchantId();
    const audiences = await this.audienceRepository.findAll(merchantId);
    return audiences.map(audience => this.audienceMapper.toDto(audience));
  }

  async updateAudience(audienceId: string, defineAudienceDto: DefineAudienceDto): Promise<AudienceDto> {
    const merchantId = this.userContextProvider.getMerchantId();
    let audience = await this.audienceRepository.findById(audienceId, merchantId);
    if (!audience) {
      throw new EntityNotFoundException('Audience', audienceId);
    }
    if (!await this.entitlementService.checkFeatureEntitlement(merchantId, 'CUSTOM_AUDIENCES_UPDATE')) { // Or same as create
        throw new CampaignLimitException('Custom audience update is not available for your plan.');
    }

    try {
        audience = this.audienceMapper.fromDefineDto(defineAudienceDto, merchantId, audience); // Update existing entity
        // audience.validateTargetingParameters(); // Re-validate
        const updatedAudience = await this.audienceRepository.save(audience);
        return this.audienceMapper.toDto(updatedAudience);
    } catch (error) {
         if (error.name === 'ValidationError') {
             throw new InvalidAudienceDataException(`Invalid targeting parameters: ${error.message}`);
        }
        throw error;
    }
  }

  async deleteAudience(audienceId: string): Promise<void> {
    const merchantId = this.userContextProvider.getMerchantId();
    const audience = await this.audienceRepository.findById(audienceId, merchantId);
    if (!audience) {
      throw new EntityNotFoundException('Audience', audienceId);
    }
    // Check if audience is in use by any active campaigns (complex check, might need a domain service)
    // const campaignsUsingAudience = await this.campaignRepository.findByAudienceId(audienceId, merchantId);
    // if (campaignsUsingAudience.some(c => c.status === CampaignStatus.ACTIVE)) {
    //   throw new BadRequestException('Cannot delete audience used by active campaigns.');
    // }
    await this.audienceRepository.remove(audience);
  }
}