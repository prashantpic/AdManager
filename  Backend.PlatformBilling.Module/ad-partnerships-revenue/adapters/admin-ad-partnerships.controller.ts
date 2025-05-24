import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Get, // Added for consistency, though not in original spec but typical for admin listing
  Query, // Added for consistency
} from '@nestjs/common';
import { AdPartnershipApplicationService } from '../application/services/ad-partnership.application-service';
import { CreateAdPartnershipDto } from '../application/dto/create-ad-partnership.dto';
import { AdPartnershipAgreement } from '../domain/entities/ad-partnership-agreement.entity';
import { UpdateAdPartnershipDto } from '../application/dto/update-ad-partnership.dto';
import { CreateManagedServiceDto } from '../application/dto/create-managed-service.dto';
import { ManagedAdServiceOffering } from '../domain/entities/managed-ad-service-offering.entity';
import { UpdateManagedServiceDto } from '../application/dto/update-managed-service.dto';
import { RecordPartnershipRevenueDto } from '../application/dto/record-partnership-revenue.dto';
import { PartnershipRevenueEntry } from '../domain/entities/partnership-revenue-entry.entity';
import { RecordManagedServiceRevenueDto } from '../application/dto/record-managed-service-revenue.dto';
import { ManagedServiceRevenueEntry } from '../domain/entities/managed-service-revenue-entry.entity';
// Assuming JwtAuthGuard and RolesGuard are provided by a core/auth module
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';


/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.AdPartnershipsRevenue.Adapters
 */
@Controller('platform-billing/ad-partnerships/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminAdPartnershipsController {
  constructor(
    private readonly adPartnershipService: AdPartnershipApplicationService,
  ) {}

  @Post('agreements')
  @HttpCode(HttpStatus.CREATED)
  async createAdPartnershipAgreement(
    @Body() createDto: CreateAdPartnershipDto,
  ): Promise<AdPartnershipAgreement> {
    return this.adPartnershipService.createAdPartnershipAgreement(createDto);
  }

  @Put('agreements/:agreementId')
  async updateAdPartnershipAgreement(
    @Param('agreementId', ParseUUIDPipe) agreementId: string,
    @Body() updateDto: UpdateAdPartnershipDto,
  ): Promise<AdPartnershipAgreement> {
    return this.adPartnershipService.updateAdPartnershipAgreement(
      agreementId,
      updateDto,
    );
  }
  
  // Example: Get specific agreement
  @Get('agreements/:agreementId')
  async getAdPartnershipAgreement(
    @Param('agreementId', ParseUUIDPipe) agreementId: string,
  ): Promise<AdPartnershipAgreement> {
    return this.adPartnershipService.getAdPartnershipAgreementById(agreementId);
  }

  // Example: Get all agreements
  @Get('agreements')
  async getAllAdPartnershipAgreements(
     @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdPartnershipAgreement>> {
    return this.adPartnershipService.getAllAdPartnershipAgreements(query);
  }


  @Post('managed-services')
  @HttpCode(HttpStatus.CREATED)
  async createManagedAdServiceOffering(
    @Body() createDto: CreateManagedServiceDto,
  ): Promise<ManagedAdServiceOffering> {
    return this.adPartnershipService.createManagedAdServiceOffering(createDto);
  }

  @Put('managed-services/:offeringId')
  async updateManagedAdServiceOffering(
    @Param('offeringId', ParseUUIDPipe) offeringId: string,
    @Body() updateDto: UpdateManagedServiceDto,
  ): Promise<ManagedAdServiceOffering> {
    return this.adPartnershipService.updateManagedAdServiceOffering(
      offeringId,
      updateDto,
    );
  }

  // Example: Get specific offering
  @Get('managed-services/:offeringId')
  async getManagedAdServiceOffering(
    @Param('offeringId', ParseUUIDPipe) offeringId: string,
  ): Promise<ManagedAdServiceOffering> {
    return this.adPartnershipService.getManagedAdServiceOfferingById(offeringId);
  }

  // Example: Get all offerings
  @Get('managed-services')
  async getAllManagedAdServiceOfferings(
     @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ManagedAdServiceOffering>> {
    return this.adPartnershipService.getAllManagedAdServiceOfferings(query);
  }


  @Post('revenue/partnership')
  @HttpCode(HttpStatus.CREATED)
  async recordPartnershipRevenue(
    @Body() revenueDto: RecordPartnershipRevenueDto,
  ): Promise<PartnershipRevenueEntry> {
    return this.adPartnershipService.recordRevenueFromPartnership(revenueDto);
  }

  @Post('revenue/managed-service')
  @HttpCode(HttpStatus.CREATED)
  async recordManagedServiceRevenue(
    @Body() revenueDto: RecordManagedServiceRevenueDto,
  ): Promise<ManagedServiceRevenueEntry> {
    return this.adPartnershipService.recordRevenueFromManagedService(revenueDto);
  }

   // Example: Get partnership revenue entries
  @Get('revenue/partnership')
  async getPartnershipRevenueEntries(
    @Query() query: PaginationQueryDto, // Add more specific query DTO if needed
  ): Promise<PaginatedResponseDto<PartnershipRevenueEntry>> {
    return this.adPartnershipService.getPartnershipRevenueEntries(query);
  }

  // Example: Get managed service revenue entries
  @Get('revenue/managed-service')
  async getManagedServiceRevenueEntries(
    @Query() query: PaginationQueryDto, // Add more specific query DTO if needed
  ): Promise<PaginatedResponseDto<ManagedServiceRevenueEntry>> {
    return this.adPartnershipService.getManagedServiceRevenueEntries(query);
  }
}