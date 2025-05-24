import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InPlatformAdsBillingApplicationService } from '../application/services/in-platform-ads-billing.application-service';
import { PurchasePromotedListingDto } from '../application/dto/purchase-promoted-listing.dto';
import { PromotedListingCharge } from '../domain/entities/promoted-listing-charge.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
// Assuming JwtAuthGuard and RolesGuard are provided by a core/auth module
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Adapters
 */
@Controller('platform-billing/in-platform-ads/merchant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Merchant')
export class InPlatformAdsController {
  constructor(
    private readonly adsBillingService: InPlatformAdsBillingApplicationService,
  ) {}

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  async purchasePromotedListing(
    @Body() purchaseDto: PurchasePromotedListingDto,
    @Request() req,
  ): Promise<PromotedListingCharge> {
    const merchantId = req.user.merchantId; // Assuming merchantId is in req.user
    return this.adsBillingService.processMerchantPromotedListingPurchase(
      purchaseDto,
      merchantId,
    );
  }

  @Get()
  async getMerchantPromotedListings(
    @Request() req,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PromotedListingCharge>> {
    const merchantId = req.user.merchantId;
    return this.adsBillingService.getChargesForMerchant(merchantId, query);
  }

  @Get(':chargeId')
  async getPromotedListingDetails(
    @Param('chargeId', ParseUUIDPipe) chargeId: string,
    @Request() req,
  ): Promise<PromotedListingCharge> {
    const merchantId = req.user.merchantId;
    return this.adsBillingService.getChargeDetails(chargeId, merchantId);
  }
}