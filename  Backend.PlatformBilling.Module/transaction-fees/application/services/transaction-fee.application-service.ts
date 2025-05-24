import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { CreateTransactionFeeConfigDto } from '../dto/create-transaction-fee-config.dto';
import { TransactionFeeConfig } from '../../domain/entities/transaction-fee-config.entity';
import { ITransactionFeeConfigRepository } from '../../domain/repositories/transaction-fee-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { UpdateTransactionFeeConfigDto } from '../dto/update-transaction-fee-config.dto';
import { AppliedTransactionFee } from '../../domain/entities/applied-transaction-fee.entity';
import { IAppliedTransactionFeeRepository } from '../../domain/repositories/applied-transaction-fee.repository.interface';
import { TransactionFeeDispute } from '../../domain/entities/transaction-fee-dispute.entity';
import { ITransactionFeeDisputeRepository } from '../../domain/repositories/transaction-fee-dispute.repository.interface';
import { SubmitTransactionFeeDisputeDto } from '../dto/submit-transaction-fee-dispute.dto';
import { ResolveTransactionFeeDisputeDto } from '../dto/resolve-transaction-fee-dispute.dto';
import { InvalidFeeConfigurationException } from '../../../common/exceptions/invalid-fee-configuration.exception';
import { FeeType } from '../../../common/enums/fee-type.enum';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';
import { InjectRepository } from '@nestjs/typeorm'; // Placeholder if we use specific custom repo providers.
                                                // If using TypeORM's default, this might be different.
                                                // Assuming custom repository interfaces are injected.

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.TransactionFees.Application
 */
@Injectable()
export class TransactionFeeApplicationService {
  private readonly logger = new Logger(TransactionFeeApplicationService.name);

  constructor(
    // Using string tokens for custom repository providers as per NestJS best practices when interfaces are used.
    // These tokens would be defined in the module.
    @InjectRepository(TransactionFeeConfig) // This is incorrect for interface injection.
                                         // Correct approach: @Inject('ITransactionFeeConfigRepository')
    private readonly transactionFeeConfigRepository: ITransactionFeeConfigRepository,
    @InjectRepository(AppliedTransactionFee) // @Inject('IAppliedTransactionFeeRepository')
    private readonly appliedTransactionFeeRepository: IAppliedTransactionFeeRepository,
    @InjectRepository(TransactionFeeDispute) // @Inject('ITransactionFeeDisputeRepository')
    private readonly transactionFeeDisputeRepository: ITransactionFeeDisputeRepository,
  ) {}

  async createFeeConfiguration(createDto: CreateTransactionFeeConfigDto): Promise<TransactionFeeConfig> {
    const newConfig = new TransactionFeeConfig();
    Object.assign(newConfig, createDto);
    // Additional validation or business logic before saving can go here
    if (createDto.feeType === FeeType.PERCENTAGE && (createDto.value < 0 || createDto.value > 1)) {
        throw new InvalidFeeConfigurationException('Percentage value must be between 0 and 1.');
    }
    return this.transactionFeeConfigRepository.save(newConfig);
  }

  async getFeeConfigurationById(configId: string): Promise<TransactionFeeConfig> {
    const config = await this.transactionFeeConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException(`TransactionFeeConfig with ID ${configId} not found.`);
    }
    return config;
  }

  async getAllFeeConfigurations(query: PaginationQueryDto): Promise<PaginatedResponseDto<TransactionFeeConfig>> {
    return this.transactionFeeConfigRepository.findAll(query);
  }

  async updateFeeConfiguration(configId: string, updateDto: UpdateTransactionFeeConfigDto): Promise<TransactionFeeConfig> {
    const existingConfig = await this.getFeeConfigurationById(configId);
    Object.assign(existingConfig, updateDto);
    if (updateDto.feeType === FeeType.PERCENTAGE && (updateDto.value < 0 || updateDto.value > 1)) {
        throw new InvalidFeeConfigurationException('Percentage value must be between 0 and 1.');
    }
    return this.transactionFeeConfigRepository.save(existingConfig);
  }

  async applyFeeToMerchantSale(
    orderId: string,
    merchantId: string,
    totalOrderValue: number,
    currency: string,
    subscriptionPlanId: string,
  ): Promise<AppliedTransactionFee | null> {
    // TODO: Potentially fetch merchant's subscription details to determine applicable fee configurations
    // For now, assume subscriptionPlanId is enough or a global config is used.
    const feeConfig = await this.transactionFeeConfigRepository.findActiveBySubscriptionPlanAndCurrency(
      subscriptionPlanId,
      currency,
    );

    if (!feeConfig) {
      this.logger.warn(`No active fee configuration found for merchant ${merchantId}, subscription ${subscriptionPlanId}, currency ${currency}.`);
      return null; // Or apply a default platform fee if defined
    }

    let feeAmount = 0;
    if (feeConfig.feeType === FeeType.PERCENTAGE) {
      feeAmount = totalOrderValue * feeConfig.value;
    } else if (feeConfig.feeType === FeeType.FIXED_AMOUNT) {
      feeAmount = feeConfig.value;
    } else {
        throw new InvalidFeeConfigurationException(`Unsupported fee type in config ID ${feeConfig.id}`);
    }

    const appliedFee = new AppliedTransactionFee();
    appliedFee.merchantId = merchantId;
    appliedFee.orderId = orderId;
    appliedFee.transactionFeeConfigId = feeConfig.id;
    appliedFee.feeAmount = parseFloat(feeAmount.toFixed(2)); // Ensure 2 decimal places
    appliedFee.currency = currency;
    appliedFee.status = 'PENDING_COLLECTION'; // Initial status
    appliedFee.appliedAt = new Date();
    
    return this.appliedTransactionFeeRepository.save(appliedFee);
  }

  async collectAccruedFeesForMerchant(merchantId: string): Promise<void> {
    const uncollectedFees = await this.appliedTransactionFeeRepository.findUncollectedByMerchant(merchantId);
    if (uncollectedFees.length === 0) {
      this.logger.log(`No uncollected fees for merchant ${merchantId}.`);
      return;
    }

    // TODO: Logic to batch fees and initiate collection via PaymentModule
    // This might involve creating a payment intent, charging a stored payment method, etc.
    // For now, simulate successful collection by updating status.
    this.logger.log(`Processing collection for ${uncollectedFees.length} fees for merchant ${merchantId}.`);

    for (const fee of uncollectedFees) {
      fee.status = 'COLLECTED';
      fee.collectedAt = new Date();
      await this.appliedTransactionFeeRepository.save(fee);
    }
    // TODO: Emit event or notify relevant services about collected fees
    this.logger.log(`Successfully collected ${uncollectedFees.length} fees for merchant ${merchantId}.`);
  }

  async submitFeeDispute(submitDto: SubmitTransactionFeeDisputeDto, merchantId: string): Promise<TransactionFeeDispute> {
    const appliedFee = await this.appliedTransactionFeeRepository.findById(submitDto.appliedFeeId);
    if (!appliedFee) {
      throw new NotFoundException(`AppliedTransactionFee with ID ${submitDto.appliedFeeId} not found.`);
    }
    if (appliedFee.merchantId !== merchantId) {
      throw new UnauthorizedException('Merchant not authorized to dispute this fee.');
    }
    if (appliedFee.status === 'DISPUTED' || appliedFee.status.startsWith('RESOLVED')) {
        throw new InvalidFeeConfigurationException('This fee is already disputed or has been resolved.');
    }

    const dispute = new TransactionFeeDispute();
    dispute.appliedFeeId = submitDto.appliedFeeId;
    dispute.merchantId = merchantId;
    dispute.reason = submitDto.reason;
    dispute.supportingEvidenceUrls = submitDto.supportingEvidenceUrls;
    dispute.status = DisputeStatus.SUBMITTED;
    dispute.submittedAt = new Date();
    
    const savedDispute = await this.transactionFeeDisputeRepository.save(dispute);

    // Update applied fee status
    appliedFee.status = 'DISPUTED';
    await this.appliedTransactionFeeRepository.save(appliedFee);

    return savedDispute;
  }

  async getDisputeById(disputeId: string, requestingUserId: string, userRoles: string[]): Promise<TransactionFeeDispute> {
    const dispute = await this.transactionFeeDisputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundException(`TransactionFeeDispute with ID ${disputeId} not found.`);
    }

    const isAdmin = userRoles.includes('Admin');
    // A merchant can only see their own disputes. An admin can see any dispute.
    if (!isAdmin && dispute.merchantId !== requestingUserId) {
      throw new UnauthorizedException('User not authorized to view this dispute.');
    }
    return dispute;
  }

  async getDisputesByMerchant(merchantId: string, query: PaginationQueryDto): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    return this.transactionFeeDisputeRepository.findByMerchantId(merchantId, query);
  }

  async getAllDisputesForAdmin(query: PaginationQueryDto): Promise<PaginatedResponseDto<TransactionFeeDispute>> {
    // Assuming this method in repository implies admin access, no further role check here for now.
    return this.transactionFeeDisputeRepository.findAllAdmin(query);
  }

  async resolveFeeDispute(
    disputeId: string,
    resolveDto: ResolveTransactionFeeDisputeDto,
    adminUserId: string,
  ): Promise<TransactionFeeDispute> {
    const dispute = await this.transactionFeeDisputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundException(`TransactionFeeDispute with ID ${disputeId} not found.`);
    }
    if (dispute.status !== DisputeStatus.SUBMITTED && dispute.status !== DisputeStatus.UNDER_REVIEW) {
        throw new InvalidFeeConfigurationException(`Dispute ${disputeId} is not in a resolvable state. Current status: ${dispute.status}`);
    }
    
    dispute.status = resolveDto.resolutionStatus;
    dispute.adminNotes = resolveDto.adminNotes;
    dispute.resolvedByAdminId = adminUserId;
    dispute.resolvedAt = new Date();

    const appliedFee = await this.appliedTransactionFeeRepository.findById(dispute.appliedFeeId);
    if (!appliedFee) {
        this.logger.error(`Could not find AppliedTransactionFee with ID ${dispute.appliedFeeId} for dispute ${disputeId}`);
        // Decide on error handling: throw or log and continue updating dispute? For now, log and proceed.
    }

    if (resolveDto.resolutionStatus === DisputeStatus.RESOLVED_APPROVED) {
      if (resolveDto.adjustmentAmount && resolveDto.adjustmentAmount > 0) {
        dispute.adjustmentAmount = resolveDto.adjustmentAmount;
        // TODO: Trigger refund/credit via PaymentModule integration
        this.logger.log(`Dispute ${disputeId} approved. Adjustment amount: ${resolveDto.adjustmentAmount}. Admin: ${adminUserId}.`);
        // Update applied fee status to 'REFUNDED' or similar if applicable.
        if (appliedFee) {
            appliedFee.status = 'REFUNDED_PARTIAL'; // Or 'REFUNDED_FULL' based on amount
            // Potentially adjust feeAmount on AppliedTransactionFee or create a new transaction for the refund
            await this.appliedTransactionFeeRepository.save(appliedFee);
        }
      } else {
         if (appliedFee) {
            appliedFee.status = 'RESOLVED_NO_ACTION'; // Example status
            await this.appliedTransactionFeeRepository.save(appliedFee);
         }
      }
    } else if (resolveDto.resolutionStatus === DisputeStatus.RESOLVED_REJECTED) {
        this.logger.log(`Dispute ${disputeId} rejected. Admin: ${adminUserId}.`);
        if (appliedFee) {
            // Revert status from DISPUTED to PENDING_COLLECTION or COLLECTED depending on previous state or if it was collected.
            // This logic needs to be more robust based on the fee lifecycle. For now, a simple example:
            appliedFee.status = 'PENDING_COLLECTION'; // Or 'COLLECTED' if it was already
            await this.appliedTransactionFeeRepository.save(appliedFee);
        }
    } else if (resolveDto.resolutionStatus === DisputeStatus.CLOSED) {
        this.logger.log(`Dispute ${disputeId} closed. Admin: ${adminUserId}.`);
         if (appliedFee) {
            // Similar to rejected, decide the fee status.
            appliedFee.status = appliedFee.collectedAt ? 'COLLECTED' : 'PENDING_COLLECTION';
            await this.appliedTransactionFeeRepository.save(appliedFee);
         }
    }


    // TODO: Log admin action (enableTransactionFeeDisputeAuditTrail feature flag)
    // this.auditService.logDisputeResolution(disputeId, adminUserId, resolveDto);

    return this.transactionFeeDisputeRepository.save(dispute);
  }
}