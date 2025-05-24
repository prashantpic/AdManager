import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Put,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionFeeApplicationService } from '../application/services/transaction-fee.application-service';
import { CreateTransactionFeeConfigDto } from '../application/dto/create-transaction-fee-config.dto';
import { TransactionFeeConfig } from '../domain/entities/transaction-fee-config.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { UpdateTransactionFeeConfigDto } from '../application/dto/update-transaction-fee-config.dto';
import { SubmitTransactionFeeDisputeDto } from '../application/dto/submit-transaction-fee-dispute.dto';
import { TransactionFeeDispute } from '../domain/entities/transaction-fee-dispute.entity';
import { ResolveTransactionFeeDisputeDto } from '../application/dto/resolve-transaction-fee-dispute.dto';
// Assuming JwtAuthGuard and RolesGuard are provided by a core/auth module
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.TransactionFees.Adapters
 */
@Controller('platform-billing/transaction-fees')
@UseGuards(JwtAuthGuard)
export class TransactionFeesController {
  constructor(
    private readonly transactionFeeService: TransactionFeeApplicationService,
  ) {}

  @Post('config')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createFeeConfiguration(
    @Body() createDto: CreateTransactionFeeConfigDto,
  ): Promise<TransactionFeeConfig> {
    return this.transactionFeeService.createFeeConfiguration(createDto);
  }

  @Get('config/:configId')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  async getFeeConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
  ): Promise<TransactionFeeConfig> {
    return this.transactionFeeService.getFeeConfigurationById(configId);
  }

  @Get('config')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  async getAllFeeConfigurations(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TransactionFeeConfig>> {
    return this.transactionFeeService.getAllFeeConfigurations(query);
  }

  @Put('config/:configId')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  async updateFeeConfiguration(
    @Param('configId', ParseUUIDPipe) configId: string,
    @Body() updateDto: UpdateTransactionFeeConfigDto,
  ): Promise<TransactionFeeConfig> {
    return this.transactionFeeService.updateFeeConfiguration(configId, updateDto);
  }

  @Post('disputes')
  @Roles('Merchant')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async submitDispute(
    @Body() submitDto: SubmitTransactionFeeDisputeDto,
    @Request() req,
  ): Promise<TransactionFeeDispute> {
    // Assuming merchantId is available in req.user
    const merchantId = req.user.merchantId; 
    return this.transactionFeeService.submitFeeDispute(submitDto, merchantId);
  }

  @Get('disputes/:disputeId')
  @Roles('Merchant', 'Admin')
  @UseGuards(RolesGuard)
  async getDispute(
    @Param('disputeId', ParseUUIDPipe) disputeId: string,
    @Request() req,
  ): Promise<TransactionFeeDispute> {
    const requestingUserId = req.user.userId || req.user.merchantId; // userId for Admin, merchantId for Merchant
    const userRoles = req.user.roles;
    return this.transactionFeeService.getDisputeById(disputeId, requestingUserId, userRoles);
  }

  @Get('disputes/merchant')
  @Roles('Merchant')
  @UseGuards(RolesGuard)
  async getMerchantDisputes(
    @Request() req,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    const merchantId = req.user.merchantId;
    return this.transactionFeeService.getDisputesByMerchant(merchantId, query);
  }

  @Get('disputes/admin')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  async getAllDisputesAdmin(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    return this.transactionFeeService.getAllDisputesForAdmin(query);
  }

  @Patch('disputes/:disputeId/resolve')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  async resolveDisputeAdmin(
    @Param('disputeId', ParseUUIDPipe) disputeId: string,
    @Body() resolveDto: ResolveTransactionFeeDisputeDto,
    @Request() req,
  ): Promise<TransactionFeeDispute> {
    const adminUserId = req.user.userId;
    return this.transactionFeeService.resolveFeeDispute(disputeId, resolveDto, adminUserId);
  }
}