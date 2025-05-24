import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppCommissionApplicationService } from '../application/services/app-commission.application-service';
import { CreateAppCommissionConfigDto } from '../application/dto/create-app-commission-config.dto';
import { AppCommissionConfig } from '../domain/entities/app-commission-config.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UpdateAppCommissionConfigDto } from '../application/dto/update-app-commission-config.dto';
import { CommissionQueryDto } from '../application/dto/commission-query.dto';
import { CalculatedAppCommission } from '../domain/entities/calculated-app-commission.entity';
import { InitiateDeveloperPayoutDto } from '../application/dto/initiate-developer-payout.dto';
import { DeveloperPayout } from '../domain/entities/developer-payout.entity';
// Assuming JwtAuthGuard and RolesGuard are provided by a core/auth module
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Adapters
 */
@Controller('platform-billing/app-developer-commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin') // Default all routes to Admin for this controller
export class AppDeveloperCommissionsController {
  constructor(
    private readonly appCommissionService: AppCommissionApplicationService,
  ) {}

  @Post('config')
  @HttpCode(HttpStatus.CREATED)
  async createCommissionConfiguration(
    @Body() createDto: CreateAppCommissionConfigDto,
  ): Promise<AppCommissionConfig> {
    return this.appCommissionService.createCommissionConfiguration(createDto);
  }

  @Get('config/:configId')
  async getCommissionConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
  ): Promise<AppCommissionConfig> {
    return this.appCommissionService.getCommissionConfigurationById(configId);
  }

  @Get('config')
  async getAllCommissionConfigurations(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AppCommissionConfig>> {
    return this.appCommissionService.getAllCommissionConfigurations(query);
  }

  @Put('config/:configId')
  async updateCommissionConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
    @Body() updateDto: UpdateAppCommissionConfigDto,
  ): Promise<AppCommissionConfig> {
    return this.appCommissionService.updateCommissionConfiguration(
      configId,
      updateDto,
    );
  }

  @Get('developer/:developerId')
  async getDeveloperCommissions(
    @Param('developerId', ParseUUIDPipe) developerId: string,
    @Query() query: CommissionQueryDto,
  ): Promise<PaginatedResponseDto<CalculatedAppCommission>> {
    return this.appCommissionService.getCommissionsForDeveloper(
      developerId,
      query,
    );
  }

  @Post('payouts/initiate')
  @HttpCode(HttpStatus.ACCEPTED) // Payout is initiated, might be async
  async initiateDeveloperPayouts(
    @Body() payoutDto: InitiateDeveloperPayoutDto,
  ): Promise<DeveloperPayout> {
    return this.appCommissionService.initiatePayoutsForDeveloper(payoutDto);
  }

  @Get('payouts/developer/:developerId')
  async getDeveloperPayoutHistory(
    @Param('developerId', ParseUUIDPipe) developerId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<DeveloperPayout>> {
    return this.appCommissionService.getDeveloperPayouts(developerId, query);
  }
}