import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Put,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InPlatformAdsBillingApplicationService } from '../application/services/in-platform-ads-billing.application-service';
import { CreatePromotedListingConfigDto } from '../application/dto/create-promoted-listing-config.dto';
import { PromotedListingConfig } from '../domain/entities/promoted-listing-config.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UpdatePromotedListingConfigDto } from '../application/dto/update-promoted-listing-config.dto';
// Assuming JwtAuthGuard and RolesGuard are provided by a core/auth module
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.InPlatformAdsBilling.Adapters
 */
@Controller('platform-billing/in-platform-ads/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminInPlatformAdsController {
  constructor(
    private readonly adsBillingService: InPlatformAdsBillingApplicationService,
  ) {}

  @Post('config')
  @HttpCode(HttpStatus.CREATED)
  async createPromotedListingConfiguration(
    @Body() createDto: CreatePromotedListingConfigDto,
  ): Promise<PromotedListingConfig> {
    return this.adsBillingService.createPromotedListingConfiguration(createDto);
  }

  @Get('config/:configId')
  async getPromotedListingConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
  ): Promise<PromotedListingConfig> {
    return this.adsBillingService.getPromotedListingConfigurationById(configId);
  }

  @Get('config')
  async getAllPromotedListingConfigurations(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PromotedListingConfig>> {
    return this.adsBillingService.getAllPromotedListingConfigurations(query);
  }

  @Put('config/:configId')
  async updatePromotedListingConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
    @Body() updateDto: UpdatePromotedListingConfigDto,
  ): Promise<PromotedListingConfig> {
    return this.adsBillingService.updatePromotedListingConfiguration(
      configId,
      updateDto,
    );
  }
}