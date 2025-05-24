import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateAdPartnershipDto } from '../dto/create-ad-partnership.dto';
import { AdPartnershipAgreement } from '../../domain/entities/ad-partnership-agreement.entity';
import { IAdPartnershipAgreementRepository } from '../../domain/repositories/ad-partnership-agreement.repository.interface';
import { UpdateAdPartnershipDto } from '../dto/update-ad-partnership.dto';
import { CreateManagedServiceDto } from '../dto/create-managed-service.dto';
import { ManagedAdServiceOffering } from '../../domain/entities/managed-ad-service-offering.entity';
import { IManagedAdServiceOfferingRepository } from '../../domain/repositories/managed-ad-service-offering.repository.interface';
import { UpdateManagedServiceDto } from '../dto/update-managed-service.dto';
import { RecordPartnershipRevenueDto } from '../dto/record-partnership-revenue.dto';
import { PartnershipRevenueEntry } from '../../domain/entities/partnership-revenue-entry.entity';
import { IPartnershipRevenueEntryRepository } from '../../domain/repositories/partnership-revenue-entry.repository.interface';
import { RecordManagedServiceRevenueDto } from '../dto/record-managed-service-revenue.dto';
import { ManagedServiceRevenueEntry } from '../../domain/entities/managed-service-revenue-entry.entity';
import { IManagedServiceRevenueEntryRepository } from '../../domain/repositories/managed-service-revenue-entry.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Application
 */
@Injectable()
export class AdPartnershipApplicationService {
  private readonly logger = new Logger(AdPartnershipApplicationService.name);

  constructor(
    // @Inject('IAdPartnershipAgreementRepository')
    private readonly adPartnershipAgreementRepository: IAdPartnershipAgreementRepository,
    // @Inject('IPartnershipRevenueEntryRepository')
    private readonly partnershipRevenueEntryRepository: IPartnershipRevenueEntryRepository,
    // @Inject('IManagedAdServiceOfferingRepository')
    private readonly managedAdServiceOfferingRepository: IManagedAdServiceOfferingRepository,
    // @Inject('IManagedServiceRevenueEntryRepository')
    private readonly managedServiceRevenueEntryRepository: IManagedServiceRevenueEntryRepository,
  ) {}

  async createAdPartnershipAgreement(createDto: CreateAdPartnershipDto): Promise<AdPartnershipAgreement> {
    const newAgreement = new AdPartnershipAgreement();
    Object.assign(newAgreement, createDto);
    newAgreement.startDate = new Date(createDto.startDate);
    if (createDto.endDate) {
        newAgreement.endDate = new Date(createDto.endDate);
    }
    return this.adPartnershipAgreementRepository.save(newAgreement);
  }

  async updateAdPartnershipAgreement(agreementId: string, updateDto: UpdateAdPartnershipDto): Promise<AdPartnershipAgreement> {
    const existingAgreement = await this.getAdPartnershipAgreementById(agreementId);
    Object.assign(existingAgreement, updateDto);
    if (updateDto.startDate) {
        existingAgreement.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
        existingAgreement.endDate = new Date(updateDto.endDate);
    } else if (updateDto.hasOwnProperty('endDate') && updateDto.endDate === null) {
        existingAgreement.endDate = null;
    }
    return this.adPartnershipAgreementRepository.save(existingAgreement);
  }

  async getAdPartnershipAgreementById(agreementId: string): Promise<AdPartnershipAgreement> {
    const agreement = await this.adPartnershipAgreementRepository.findById(agreementId);
    if (!agreement) {
      throw new NotFoundException(`AdPartnershipAgreement with ID ${agreementId} not found.`);
    }
    return agreement;
  }

  async getAllAdPartnershipAgreements(query: PaginationQueryDto): Promise<PaginatedResponseDto<AdPartnershipAgreement>> {
    // Assuming repository has findAll method for pagination
    return this.adPartnershipAgreementRepository.findAll(query);
  }

  async createManagedAdServiceOffering(createDto: CreateManagedServiceDto): Promise<ManagedAdServiceOffering> {
    const newOffering = new ManagedAdServiceOffering();
    Object.assign(newOffering, createDto);
    return this.managedAdServiceOfferingRepository.save(newOffering);
  }

  async updateManagedAdServiceOffering(offeringId: string, updateDto: UpdateManagedServiceDto): Promise<ManagedAdServiceOffering> {
    const existingOffering = await this.getManagedAdServiceOfferingById(offeringId);
    Object.assign(existingOffering, updateDto);
    return this.managedAdServiceOfferingRepository.save(existingOffering);
  }

  async getManagedAdServiceOfferingById(offeringId: string): Promise<ManagedAdServiceOffering> {
    const offering = await this.managedAdServiceOfferingRepository.findById(offeringId);
    if (!offering) {
      throw new NotFoundException(`ManagedAdServiceOffering with ID ${offeringId} not found.`);
    }
    return offering;
  }

  async getAllManagedAdServiceOfferings(query: PaginationQueryDto): Promise<PaginatedResponseDto<ManagedAdServiceOffering>> {
     // Assuming repository has findAll method for pagination
    return this.managedAdServiceOfferingRepository.findAll(query);
  }

  async recordRevenueFromPartnership(revenueDto: RecordPartnershipRevenueDto): Promise<PartnershipRevenueEntry> {
    // Validate agreementId exists
    await this.getAdPartnershipAgreementById(revenueDto.agreementId);

    const revenueEntry = new PartnershipRevenueEntry();
    Object.assign(revenueEntry, revenueDto);
    revenueEntry.periodStart = new Date(revenueDto.periodStart);
    revenueEntry.periodEnd = new Date(revenueDto.periodEnd);
    revenueEntry.recordedAt = new Date(); // System timestamp for recording
    return this.partnershipRevenueEntryRepository.save(revenueEntry);
  }

  async recordRevenueFromManagedService(revenueDto: RecordManagedServiceRevenueDto): Promise<ManagedServiceRevenueEntry> {
    // Validate offeringId exists
    await this.getManagedAdServiceOfferingById(revenueDto.offeringId);
    // TODO: Validate merchantId exists (e.g., via a MerchantService or similar)

    const revenueEntry = new ManagedServiceRevenueEntry();
    Object.assign(revenueEntry, revenueDto);
    revenueEntry.periodStart = new Date(revenueDto.periodStart);
    revenueEntry.periodEnd = new Date(revenueDto.periodEnd);
    revenueEntry.recordedAt = new Date(); // System timestamp for recording
    return this.managedServiceRevenueEntryRepository.save(revenueEntry);
  }

  async getPartnershipRevenueEntries(query: PaginationQueryDto): Promise<PaginatedResponseDto<PartnershipRevenueEntry>> {
    // Assuming repository has a generic findAll or a specific method for these entries
    return this.partnershipRevenueEntryRepository.findAll(query);
  }

  async getManagedServiceRevenueEntries(query: PaginationQueryDto): Promise<PaginatedResponseDto<ManagedServiceRevenueEntry>> {
    // Assuming repository has a generic findAll or a specific method for these entries
    return this.managedServiceRevenueEntryRepository.findAll(query);
  }
}