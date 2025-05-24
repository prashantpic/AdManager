import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAppCommissionConfigDto } from '../dto/create-app-commission-config.dto';
import { AppCommissionConfig } from '../../domain/entities/app-commission-config.entity';
import { IAppCommissionConfigRepository } from '../../domain/repositories/app-commission-config.repository.interface';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { UpdateAppCommissionConfigDto } from '../dto/update-app-commission-config.dto';
import { CalculatedAppCommission } from '../../domain/entities/calculated-app-commission.entity';
import { ICalculatedAppCommissionRepository } from '../../domain/repositories/calculated-app-commission.repository.interface';
import { DeveloperPayout } from '../../domain/entities/developer-payout.entity';
import { IDeveloperPayoutRepository } from '../../domain/repositories/developer-payout.repository.interface';
import { CommissionQueryDto } from '../dto/commission-query.dto';
import { InitiateDeveloperPayoutDto } from '../dto/initiate-developer-payout.dto';
import { FeeType } from '../../../common/enums/fee-type.enum';
import { CommissionStatus } from '../../../common/enums/commission-status.enum';
import { PayoutStatus } from '../../../common/enums/payout-status.enum';
import { InvalidFeeConfigurationException } from '../../../common/exceptions/invalid-fee-configuration.exception';
// import { IntegrationService } from '../../../integration/integration.service'; // Assuming an integration service for payouts

/**
 * @namespace AdManager.Platform.Backend.PlatformBilling.AppDeveloperCommissions.Application
 */
@Injectable()
export class AppCommissionApplicationService {
  private readonly logger = new Logger(AppCommissionApplicationService.name);
  // TODO: Inject DeveloperPayoutMinimumThresholdUSD from config
  private developerPayoutMinimumThresholdUSD = 100; 

  constructor(
    // @Inject('IAppCommissionConfigRepository')
    private readonly appCommissionConfigRepository: IAppCommissionConfigRepository,
    // @Inject('ICalculatedAppCommissionRepository')
    private readonly calculatedAppCommissionRepository: ICalculatedAppCommissionRepository,
    // @Inject('IDeveloperPayoutRepository')
    private readonly developerPayoutRepository: IDeveloperPayoutRepository,
    // private readonly integrationService: IntegrationService, // For actual payout processing
  ) {}

  async createCommissionConfiguration(createDto: CreateAppCommissionConfigDto): Promise<AppCommissionConfig> {
    const newConfig = new AppCommissionConfig();
    Object.assign(newConfig, createDto);
    // Additional validation: e.g. rate for percentage type
    if (createDto.rateType === FeeType.PERCENTAGE && (createDto.rate < 0 || createDto.rate > 1)) {
        throw new InvalidFeeConfigurationException('Percentage rate must be between 0 and 1.');
    }
    return this.appCommissionConfigRepository.save(newConfig);
  }

  async getCommissionConfigurationById(configId: string): Promise<AppCommissionConfig> {
    const config = await this.appCommissionConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException(`AppCommissionConfig with ID ${configId} not found.`);
    }
    return config;
  }

  async getAllCommissionConfigurations(query: PaginationQueryDto): Promise<PaginatedResponseDto<AppCommissionConfig>> {
    return this.appCommissionConfigRepository.findAll(query);
  }

  async updateCommissionConfiguration(configId: string, updateDto: UpdateAppCommissionConfigDto): Promise<AppCommissionConfig> {
    const existingConfig = await this.getCommissionConfigurationById(configId);
    Object.assign(existingConfig, updateDto);
    if (updateDto.rateType === FeeType.PERCENTAGE && updateDto.rate && (updateDto.rate < 0 || updateDto.rate > 1)) {
        throw new InvalidFeeConfigurationException('Percentage rate must be between 0 and 1.');
    }
    return this.appCommissionConfigRepository.save(existingConfig);
  }

  async calculateCommissionForAppSale(
    appId: string,
    developerId: string,
    saleAmount: number,
    currency: string,
    appSaleTransactionId: string,
  ): Promise<CalculatedAppCommission> {
    const commissionConfig = await this.appCommissionConfigRepository.findActiveConfigForAppOrDeveloper(
      appId,
      developerId,
      currency,
    );

    if (!commissionConfig) {
      this.logger.warn(`No active commission config found for app ${appId}, developer ${developerId}, currency ${currency}.`);
      // Potentially create a commission record with 0 amount or handle as an error
      throw new InvalidFeeConfigurationException(`No commission configuration applicable for this sale.`);
    }

    let commissionAmount = 0;
    // TODO: Refine commissionableAmount based on commissionConfig.calculationBasis
    // For now, assume saleAmount is the commissionableAmount
    const commissionableAmount = saleAmount; 

    if (commissionConfig.rateType === FeeType.PERCENTAGE) {
      commissionAmount = commissionableAmount * commissionConfig.rate;
    } else if (commissionConfig.rateType === FeeType.FIXED_AMOUNT) {
      commissionAmount = commissionConfig.rate; // Assuming 'rate' stores the fixed amount here
    } else {
        throw new InvalidFeeConfigurationException(`Unsupported rate type in config ID ${commissionConfig.id}`);
    }

    const calculatedCommission = new CalculatedAppCommission();
    calculatedCommission.developerId = developerId;
    calculatedCommission.appId = appId;
    calculatedCommission.appCommissionConfigId = commissionConfig.id;
    calculatedCommission.appSaleTransactionId = appSaleTransactionId;
    calculatedCommission.originalSaleAmount = saleAmount;
    calculatedCommission.commissionableAmount = commissionableAmount;
    calculatedCommission.commissionRate = commissionConfig.rate;
    calculatedCommission.commissionAmount = parseFloat(commissionAmount.toFixed(2));
    calculatedCommission.currency = currency;
    calculatedCommission.status = CommissionStatus.CALCULATED;
    calculatedCommission.calculatedAt = new Date();

    return this.calculatedAppCommissionRepository.save(calculatedCommission);
  }

  async adjustCommissionForAppRefund(
    originalAppSaleTransactionId: string,
    refundAmount: number, // This is the amount of the sale that was refunded
  ): Promise<CalculatedAppCommission | null> {
    const originalCommission = await this.calculatedAppCommissionRepository.findByAppSaleTransactionId(
      originalAppSaleTransactionId,
    );

    if (!originalCommission) {
      this.logger.warn(`Original commission for sale transaction ID ${originalAppSaleTransactionId} not found for refund adjustment.`);
      return null;
    }
    
    if (originalCommission.status === CommissionStatus.CLAWED_BACK || originalCommission.status === CommissionStatus.CANCELLED) {
        this.logger.warn(`Original commission ${originalCommission.id} already clawed back or cancelled.`);
        return originalCommission;
    }

    // Calculate the proportion of the refund to the original sale amount
    // Assuming refundAmount <= originalCommission.originalSaleAmount
    let refundProportion = 1; // Default to full clawback if originalSaleAmount is 0 or refundAmount is greater
    if (originalCommission.originalSaleAmount > 0) {
        refundProportion = Math.min(refundAmount / originalCommission.originalSaleAmount, 1);
    }
    
    const clawbackAmount = originalCommission.commissionAmount * refundProportion;

    const adjustmentEntry = new CalculatedAppCommission();
    adjustmentEntry.developerId = originalCommission.developerId;
    adjustmentEntry.appId = originalCommission.appId;
    adjustmentEntry.appCommissionConfigId = originalCommission.appCommissionConfigId; // Or a specific clawback config
    adjustmentEntry.appSaleTransactionId = `${originalAppSaleTransactionId}-REFUND`; // Distinguish transaction ID
    adjustmentEntry.originalSaleAmount = -refundAmount; // Negative to signify refund
    adjustmentEntry.commissionableAmount = -(originalCommission.commissionableAmount * refundProportion);
    adjustmentEntry.commissionRate = originalCommission.commissionRate; // Or a specific clawback rate
    adjustmentEntry.commissionAmount = -parseFloat(clawbackAmount.toFixed(2)); // Negative amount for clawback
    adjustmentEntry.currency = originalCommission.currency;
    adjustmentEntry.status = CommissionStatus.CLAWED_BACK;
    adjustmentEntry.calculatedAt = new Date();
    adjustmentEntry.adjustmentForRefundId = originalCommission.id; // Link to the original commission

    const savedAdjustment = await this.calculatedAppCommissionRepository.save(adjustmentEntry);

    // Update original commission status if fully clawed back
    // This logic might need refinement based on partial vs full refunds and clawbacks.
    // For simplicity, if any clawback happens, mark original as disputed or partially_clawed_back.
    // If refundAmount >= originalCommission.originalSaleAmount, then it's a full clawback.
    if (refundAmount >= originalCommission.originalSaleAmount) {
        originalCommission.status = CommissionStatus.CLAWED_BACK; // Or CANCELLED if it effectively nullifies it
    } else {
        originalCommission.status = CommissionStatus.DISPUTED; // Or a new status like 'PARTIALLY_CLAWED_BACK'
    }
    await this.calculatedAppCommissionRepository.save(originalCommission);

    return savedAdjustment;
  }

  async getCommissionsForDeveloper(developerId: string, query: CommissionQueryDto): Promise<PaginatedResponseDto<CalculatedAppCommission>> {
    return this.calculatedAppCommissionRepository.findByDeveloperId(developerId, query);
  }

  async initiatePayoutsForDeveloper(payoutDto: InitiateDeveloperPayoutDto): Promise<DeveloperPayout> {
    // TODO: Implement logic for selecting commissions if payoutDto.commissionIds is provided
    // For now, focusing on developerId-based payout of all eligible.

    if (!payoutDto.developerId) {
        throw new BadRequestException('Developer ID must be provided for targeted payouts.');
        // TODO: Implement logic for batch payouts for all eligible developers if developerId is null.
        // This is more complex and likely involves queuing.
    }

    const query: CommissionQueryDto = {
        status: CommissionStatus.CALCULATED,
        // Pagination for fetching commissions to payout - should fetch all eligible
        page: 1,
        limit: 1000, // A large limit to fetch many, or implement proper iteration
    };
    const commissionsToPay = await this.calculatedAppCommissionRepository.findByDeveloperId(payoutDto.developerId, query);

    const eligibleCommissions = commissionsToPay.data.filter(
      (c) => c.commissionAmount > 0 && c.status === CommissionStatus.CALCULATED,
    );

    if (eligibleCommissions.length === 0) {
      throw new NotFoundException(`No eligible commissions found for developer ${payoutDto.developerId} for payout.`);
    }

    const totalPayoutAmount = eligibleCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const currency = eligibleCommissions[0].currency; // Assume all commissions for a payout are in the same currency

    // Check against minimum payout threshold (assuming USD for now, needs currency conversion if mixed)
    // For simplicity, assuming all are in USD if threshold is USD.
    if (currency === 'USD' && totalPayoutAmount < this.developerPayoutMinimumThresholdUSD) {
        throw new BadRequestException(
            `Total payout amount ${totalPayoutAmount} ${currency} is below the minimum threshold of ${this.developerPayoutMinimumThresholdUSD} USD.`
        );
    }
    // TODO: Add currency conversion logic if DeveloperPayoutMinimumThresholdUSD is fixed and commissions are in other currencies.

    const developerPayout = new DeveloperPayout();
    developerPayout.developerId = payoutDto.developerId;
    developerPayout.payoutAmount = parseFloat(totalPayoutAmount.toFixed(2));
    developerPayout.currency = currency;
    developerPayout.payoutDate = payoutDto.payoutDate ? new Date(payoutDto.payoutDate) : new Date();
    developerPayout.status = PayoutStatus.PENDING; // Initial status before actual processing
    developerPayout.payoutMethod = payoutDto.payoutMethod; 
    // developerPayout.commissions = eligibleCommissions; // This relation will be set by TypeORM by linking back

    const savedPayout = await this.developerPayoutRepository.save(developerPayout);

    // Update commission statuses
    const commissionsToUpdate: CalculatedAppCommission[] = [];
    for (const commission of eligibleCommissions) {
      commission.status = CommissionStatus.PENDING_PAYOUT;
      commission.payoutId = savedPayout.id;
      commissionsToUpdate.push(commission);
    }
    await this.calculatedAppCommissionRepository.saveMany(commissionsToUpdate);
    
    savedPayout.commissions = commissionsToUpdate; // For returning the full object with relations

    // TODO: Initiate actual payout via IntegrationModule (e.g., Payment Gateway client)
    // const enableAutomatedPayouts = true; // from feature flag
    // if (enableAutomatedPayouts && this.integrationService) {
    //   try {
    //     const paymentResult = await this.integrationService.processDeveloperPayout(savedPayout);
    //     savedPayout.paymentTransactionId = paymentResult.transactionId;
    //     savedPayout.status = PayoutStatus.PROCESSING; // Or COMPLETED if synchronous and successful
    //     // Update commission statuses to PAID if successful
    //   } catch (error) {
    //     this.logger.error(`Payout processing failed for payout ID ${savedPayout.id}:`, error);
    //     savedPayout.status = PayoutStatus.FAILED;
    //     savedPayout.processingNotes = error.message;
    //     // Revert commission statuses to CALCULATED
    //     for (const commission of eligibleCommissions) {
    //       commission.status = CommissionStatus.CALCULATED;
    //       commission.payoutId = null;
    //     }
    //     await this.calculatedAppCommissionRepository.saveMany(eligibleCommissions);
    //   }
    //   await this.developerPayoutRepository.save(savedPayout);
    // } else {
    //   this.logger.log(`Automated payouts disabled or integration service not available. Payout ID ${savedPayout.id} is PENDING manual processing.`);
    // }

    this.logger.log(`Payout ID ${savedPayout.id} initiated for developer ${payoutDto.developerId} with amount ${totalPayoutAmount} ${currency}.`);
    return savedPayout;
  }

  async getDeveloperPayouts(developerId: string, query: PaginationQueryDto): Promise<PaginatedResponseDto<DeveloperPayout>> {
    return this.developerPayoutRepository.findByDeveloperId(developerId, query);
  }
}