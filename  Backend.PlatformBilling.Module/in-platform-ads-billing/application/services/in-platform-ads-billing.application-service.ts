import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreatePromotedListingConfigDto } from '../dto/create-promoted-listing-config.dto';
import { PromotedListingConfig } from '../../domain/entities/promoted-listing-config.entity';
import { IPromotedListingConfigRepository } from '../../domain/repositories/promoted-listing-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { UpdatePromotedListingConfigDto } from '../dto/update-promoted-listing-config.dto';
import { PurchasePromotedListingDto } from '../dto/purchase-promoted-listing.dto';
import { PromotedListingCharge } from '../../domain/entities/promoted-listing-charge.entity';
import { IPromotedListingChargeRepository } from '../../domain/repositories/promoted-listing-charge.repository.interface';
import { PromotedListingBid } from '../../domain/entities/promoted-listing-bid.entity';
import { IPromotedListingBidRepository } from '../../domain/repositories/promoted-listing-bid.repository.interface';
import { PricingModel } from '../../../common/enums/pricing-model.enum';
import { InvalidFeeConfigurationException } from '../../../common/exceptions/invalid-fee-configuration.exception'; // Using for general config issues

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Application
 */
@Injectable()
export class InPlatformAdsBillingApplicationService {
  private readonly logger = new Logger(InPlatformAdsBillingApplicationService.name);

  constructor(
    // @Inject('IPromotedListingConfigRepository')
    private readonly promotedListingConfigRepository: IPromotedListingConfigRepository,
    // @Inject('IPromotedListingChargeRepository')
    private readonly promotedListingChargeRepository: IPromotedListingChargeRepository,
    // @Inject('IPromotedListingBidRepository')
    private readonly promotedListingBidRepository: IPromotedListingBidRepository,
  ) {}

  async createPromotedListingConfiguration(createDto: CreatePromotedListingConfigDto): Promise<PromotedListingConfig> {
    const newConfig = new PromotedListingConfig();
    Object.assign(newConfig, createDto);
    // Validation for pricing model and price
    if (createDto.pricingModel === PricingModel.FIXED_FEE && (createDto.price === null || createDto.price === undefined || createDto.price < 0) ) {
        throw new InvalidFeeConfigurationException('Fixed fee pricing model requires a non-negative price.');
    }
    if ((createDto.pricingModel === PricingModel.CPC || createDto.pricingModel === PricingModel.CPM) && createDto.price && createDto.price < 0) {
        throw new InvalidFeeConfigurationException('CPC/CPM base price cannot be negative.');
    }
    if (createDto.pricingModel === PricingModel.BID_BASED && !createDto.bidRules) {
        throw new InvalidFeeConfigurationException('Bid-based pricing model requires bid rules.');
    }
    return this.promotedListingConfigRepository.save(newConfig);
  }

  async getPromotedListingConfigurationById(configId: string): Promise<PromotedListingConfig> {
    const config = await this.promotedListingConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException(`PromotedListingConfig with ID ${configId} not found.`);
    }
    return config;
  }

  async getAllPromotedListingConfigurations(query: PaginationQueryDto): Promise<PaginatedResponseDto<PromotedListingConfig>> {
    return this.promotedListingConfigRepository.findAll(query);
  }

  async updatePromotedListingConfiguration(configId: string, updateDto: UpdatePromotedListingConfigDto): Promise<PromotedListingConfig> {
    const existingConfig = await this.getPromotedListingConfigurationById(configId);
    Object.assign(existingConfig, updateDto);
     if (updateDto.pricingModel === PricingModel.FIXED_FEE && (updateDto.price === null || updateDto.price === undefined || updateDto.price < 0) ) {
        throw new InvalidFeeConfigurationException('Fixed fee pricing model requires a non-negative price.');
    }
    // Add other validations similar to create
    return this.promotedListingConfigRepository.save(existingConfig);
  }

  async processMerchantPromotedListingPurchase(
    purchaseDto: PurchasePromotedListingDto,
    merchantId: string,
  ): Promise<PromotedListingCharge> {
    const config = await this.getPromotedListingConfigurationById(purchaseDto.promotedListingConfigId);
    if (!config.isActive) {
        throw new InvalidFeeConfigurationException(`Promoted listing configuration ${config.id} is not active.`);
    }

    let chargeAmount = 0;
    if (config.pricingModel === PricingModel.FIXED_FEE) {
      if (config.price === null || config.price === undefined) {
          throw new InvalidFeeConfigurationException(`Configuration ${config.id} is FIXED_FEE but has no price.`);
      }
      chargeAmount = config.price;
    } else if (config.pricingModel === PricingModel.BID_BASED) {
      if (!purchaseDto.bidAmount || purchaseDto.bidAmount <= 0) {
        throw new BadRequestException('Bid amount is required and must be positive for bid-based listings.');
      }
      // Initial charge might be 0 or based on bid rules; actual charge determined by auction.
      // For now, let's assume bidAmount is a direct upfront payment or pre-authorization for simplicity.
      // Or, chargeAmount might be initially 0 and updated after auction. Let's set it to bid for now.
      chargeAmount = purchaseDto.bidAmount; 
    }
    // For CPC/CPM, initial charge might be 0 or a budget cap. Actual charges accrue.
    // Let's assume budget sets the initial charge or is handled separately. For now, initial charge is 0 for CPC/CPM.
    if (config.pricingModel === PricingModel.CPC || config.pricingModel === PricingModel.CPM) {
        chargeAmount = 0; // Will accrue based on usage. Budget is handled separately.
    }


    const charge = new PromotedListingCharge();
    charge.merchantId = merchantId;
    charge.promotedListingConfigId = config.id;
    charge.productId = purchaseDto.productId;
    charge.chargeAmount = parseFloat(chargeAmount.toFixed(2));
    charge.currency = config.currency; // Assuming config has currency
    charge.usagePeriodStart = new Date();
    const durationDays = purchaseDto.durationDays || 30; // Default duration if not provided
    charge.usagePeriodEnd = new Date(charge.usagePeriodStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
    charge.status = 'ACTIVE'; // Or 'PENDING_AUCTION' if bid-based

    const savedCharge = await this.promotedListingChargeRepository.save(charge);

    if (config.pricingModel === PricingModel.BID_BASED && purchaseDto.bidAmount) {
      const bid = new PromotedListingBid();
      bid.promotedListingChargeId = savedCharge.id;
      bid.merchantId = merchantId;
      bid.bidAmount = purchaseDto.bidAmount;
      bid.bidTime = new Date();
      bid.status = 'ACTIVE_BID'; // Initial bid status
      await this.promotedListingBidRepository.save(bid);
      savedCharge.status = 'PENDING_AUCTION'; // Update charge status if bid-based
      await this.promotedListingChargeRepository.save(savedCharge);
    }
    
    // TODO: Handle budget (purchaseDto.budget) - e.g., store it on the charge or a related entity.

    return savedCharge;
  }

  async recordPromotedListingUsageAndCalculateCharges(
    chargeId: string, // This should be promotedListingChargeId
    usageData: { impressions?: number; clicks?: number; conversionEvents?: any[] },
  ): Promise<void> {
    const charge = await this.promotedListingChargeRepository.findById(chargeId);
    if (!charge) {
      throw new NotFoundException(`PromotedListingCharge with ID ${chargeId} not found.`);
    }
    if (charge.status !== 'ACTIVE' && charge.status !== 'PENDING_AUCTION') { // Allow updates if pending auction, e.g. auction resolved
        this.logger.warn(`Charge ${chargeId} is not in an active state for recording usage. Status: ${charge.status}`);
        return;
    }

    const config = await this.getPromotedListingConfigurationById(charge.promotedListingConfigId);

    if (usageData.impressions) {
      charge.impressions = (charge.impressions || 0) + usageData.impressions;
    }
    if (usageData.clicks) {
      charge.clicks = (charge.clicks || 0) + usageData.clicks;
    }

    if (config.pricingModel === PricingModel.CPM && usageData.impressions && config.price) {
      // price is per 1000 impressions
      const costForImpressions = (usageData.impressions / 1000) * config.price;
      charge.chargeAmount += costForImpressions;
    } else if (config.pricingModel === PricingModel.CPC && usageData.clicks && config.price) {
      const costForClicks = usageData.clicks * config.price;
      charge.chargeAmount += costForClicks;
    } else if (config.pricingModel === PricingModel.BID_BASED) {
      // TODO: Interact with an auction mechanism.
      // This is a placeholder. Real auction logic is complex.
      // If an auction resolves, update bid status and chargeAmount with winning bid.
      // For example, if this usageData indicates the auction was won:
      // const winningBidAmount = 1.23; // From auction service
      // charge.chargeAmount = winningBidAmount;
      // charge.status = 'ACTIVE'; // If auction won and now active
      // const bid = await this.promotedListingBidRepository.findLatestByChargeId(chargeId);
      // if (bid) { bid.status = 'WON_AUCTION'; await this.promotedListingBidRepository.save(bid); }
      this.logger.log(`BID_BASED usage recorded for ${chargeId}. Auction resolution logic TBD.`);
    }
    
    // Ensure chargeAmount is properly formatted
    charge.chargeAmount = parseFloat(charge.chargeAmount.toFixed(2));

    // TODO: Check against budget if applicable. If budget exceeded, change status (e.g., 'PAUSED_BUDGET_EXCEEDED').

    await this.promotedListingChargeRepository.save(charge);
    this.logger.log(`Usage recorded for charge ID ${chargeId}. Clicks: ${charge.clicks}, Impressions: ${charge.impressions}, New Total Charge: ${charge.chargeAmount}`);
  }

  async getChargesForMerchant(merchantId: string, query: PaginationQueryDto): Promise<PaginatedResponseDto<PromotedListingCharge>> {
    return this.promotedListingChargeRepository.findByMerchantId(merchantId, query);
  }

  async getChargeDetails(chargeId: string, merchantId: string): Promise<PromotedListingCharge> {
    const charge = await this.promotedListingChargeRepository.findById(chargeId);
    if (!charge) {
      throw new NotFoundException(`PromotedListingCharge with ID ${chargeId} not found.`);
    }
    if (charge.merchantId !== merchantId) {
      throw new UnauthorizedException('Merchant not authorized to view this charge.');
    }
    return charge;
  }
}