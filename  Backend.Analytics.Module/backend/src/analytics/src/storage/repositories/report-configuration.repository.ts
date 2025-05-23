import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportConfigurationEntity } from '../entities/report-configuration.entity';

/**
 * Repository for managing persistence of merchant-saved report configurations.
 */
@Injectable()
export class ReportConfigurationRepository {
  private readonly logger = new Logger(ReportConfigurationRepository.name);

  constructor(
    @InjectRepository(ReportConfigurationEntity)
    private readonly repository: Repository<ReportConfigurationEntity>,
  ) {}

  /**
   * Finds all configurations for a given merchant.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to an array of report configuration entities.
   */
  async findByMerchantId(
    merchantId: string,
  ): Promise<ReportConfigurationEntity[]> {
    this.logger.log(
      `Finding report configurations for merchant ${merchantId}`,
    );
    try {
      return await this.repository.find({ where: { merchantId } });
    } catch (error) {
      this.logger.error(`Error finding report configurations by merchant ID ${merchantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Finds a specific configuration by ID for a merchant.
   * @param id - The ID of the report configuration.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to the report configuration entity or null if not found.
   */
  async findByIdAndMerchantId(
    id: string,
    merchantId: string,
  ): Promise<ReportConfigurationEntity | null> {
    this.logger.log(
      `Finding report configuration by ID ${id} for merchant ${merchantId}`,
    );
    try {
      return await this.repository.findOne({ where: { id, merchantId } });
    } catch (error) {
      this.logger.error(`Error finding report configuration by ID ${id} and merchant ID ${merchantId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Saves or updates a report configuration.
   * The entity should have `merchantId` and other fields populated.
   * If `id` is present, it attempts an update; otherwise, it creates a new record.
   * @param config - A partial entity of ReportConfigurationEntity to save or update.
   * @returns A promise resolving to the saved report configuration entity.
   */
  async saveConfiguration(
    config: Partial<ReportConfigurationEntity>,
  ): Promise<ReportConfigurationEntity> {
    this.logger.log(
      `Saving report configuration ID ${config.id || 'new'} for merchant ${config.merchantId}`,
    );
    try {
      // TypeORM's save method handles both insert and update based on the presence of the primary key.
      // Ensure merchantId is part of the partial entity.
      if (!config.merchantId) {
        throw new Error('MerchantId is required to save a report configuration.');
      }
      return await this.repository.save(config);
    } catch (error) {
      this.logger.error(`Error saving report configuration ID ${config.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deletes a configuration by ID for a merchant, returns true if successful.
   * @param id - The ID of the report configuration to delete.
   * @param merchantId - The ID of the merchant.
   * @returns A promise resolving to true if a record was deleted, false otherwise.
   */
  async deleteByIdAndMerchantId(
    id: string,
    merchantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Deleting report configuration ID ${id} for merchant ${merchantId}`,
    );
    try {
      const result = await this.repository.delete({ id, merchantId });
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      this.logger.error(`Error deleting report configuration ID ${id} for merchant ${merchantId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}