import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ShippingRuleService } from './rules/services/shipping-rule.service';
import { ShippingService } from './shipping.service';
import { CreateShippingRuleDto } from './rules/dto/create-shipping-rule.dto';
import { UpdateShippingRuleDto } from './rules/dto/update-shipping-rule.dto';
import { ShippingRuleDto } from './rules/dto/shipping-rule.dto';
import { AuthGuard } from '@admanager/backend.user-auth.module'; // Assuming AuthGuard from UserAuth module
// Import DTOs for list query if defined
// import { ListShippingRulesQueryDto } from './rules/dto/list-shipping-rules-query.dto';
import { ShippingRuleNotFoundError } from './common/errors/shipping.errors';
import { ShippingRuleEntity } from './rules/entities/shipping-rule.entity';
import { ShippingRuleConditionDto } from './rules/dto/shipping-rule-condition.dto';
import { ShippingRuleActionDto } from './rules/dto/shipping-rule-action.dto';

// Mock for ListShippingRulesQueryDto if not provided
interface ListShippingRulesQueryDto {
  isActive?: boolean;
  page?: number;
  limit?: number;
}


@Controller('shipping')
@UseGuards(AuthGuard) // Apply AuthGuard to all routes in this controller
export class ShippingController {
  private readonly logger = new Logger(ShippingController.name);

  constructor(
    private readonly shippingRuleService: ShippingRuleService,
    // ShippingService is injected but not directly used for public endpoints in this controller version
    // It's available for potential future extensions or internal coordination if needed.
    private readonly shippingService: ShippingService,
  ) {}

  private mapEntityToDto(ruleEntity: ShippingRuleEntity): ShippingRuleDto {
    // This mapping ensures that the response DTO structure is consistent.
    // TypeORM entities might have methods or other properties not suitable for direct exposure.
    // It also handles potential transformations (e.g., Date to ISO string).
    return {
      id: ruleEntity.id,
      merchantId: ruleEntity.merchantId,
      name: ruleEntity.name,
      // Assuming conditions and action in entity are compatible with DTO structures
      // If not, specific mapping logic is needed here.
      conditions: ruleEntity.conditions as ShippingRuleConditionDto[],
      action: ruleEntity.action as ShippingRuleActionDto,
      priority: ruleEntity.priority,
      isActive: ruleEntity.isActive,
      createdAt: ruleEntity.createdAt.toISOString() as any, // Cast to any to satisfy DTO type if it's string
      updatedAt: ruleEntity.updatedAt.toISOString() as any,
    };
  }

  /**
   * Creates a new shipping rule for the authenticated merchant.
   */
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async createShippingRule(
    @Req() req: { user: { merchantId: string } }, // Assuming user/merchant info is attached
    @Body() createShippingRuleDto: CreateShippingRuleDto,
  ): Promise<ShippingRuleDto> {
    const merchantId = req.user.merchantId;
    this.logger.log(`Creating shipping rule for merchant ${merchantId}: ${createShippingRuleDto.name}`);
    const ruleEntity = await this.shippingRuleService.createRule(
      merchantId,
      createShippingRuleDto,
    );
    return this.mapEntityToDto(ruleEntity);
  }

  /**
   * Retrieves a specific shipping rule for the authenticated merchant.
   * @param ruleId The ID of the shipping rule.
   */
  @Get('rules/:ruleId')
  async getShippingRule(
    @Req() req: { user: { merchantId: string } },
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ): Promise<ShippingRuleDto> {
    const merchantId = req.user.merchantId;
    this.logger.log(`Getting shipping rule ${ruleId} for merchant ${merchantId}`);
    const ruleEntity = await this.shippingRuleService.getRuleById(merchantId, ruleId);

    if (!ruleEntity) {
      this.logger.warn(`Shipping rule ${ruleId} not found for merchant ${merchantId}`);
      throw new ShippingRuleNotFoundError(ruleId);
    }
    return this.mapEntityToDto(ruleEntity);
  }

  /**
   * Updates an existing shipping rule for the authenticated merchant.
   * @param ruleId The ID of the shipping rule.
   * @param updateShippingRuleDto The data to update.
   */
  @Put('rules/:ruleId')
  async updateShippingRule(
    @Req() req: { user: { merchantId: string } },
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() updateShippingRuleDto: UpdateShippingRuleDto,
  ): Promise<ShippingRuleDto> {
    const merchantId = req.user.merchantId;
    this.logger.log(`Updating shipping rule ${ruleId} for merchant ${merchantId}`);
    // Service handles NotFoundError
    const ruleEntity = await this.shippingRuleService.updateRule(
      merchantId,
      ruleId,
      updateShippingRuleDto,
    );
    return this.mapEntityToDto(ruleEntity);
  }

  /**
   * Deletes a shipping rule for the authenticated merchant.
   * @param ruleId The ID of the shipping rule.
   */
  @Delete('rules/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteShippingRule(
    @Req() req: { user: { merchantId: string } },
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
  ): Promise<void> {
    const merchantId = req.user.merchantId;
    this.logger.log(`Deleting shipping rule ${ruleId} for merchant ${merchantId}`);
    // Service handles NotFoundError
    await this.shippingRuleService.deleteRule(merchantId, ruleId);
  }

  /**
   * Lists all shipping rules for the authenticated merchant.
   * @param queryParams Optional query parameters (e.g., pagination, filtering).
   */
  @Get('rules')
  async listShippingRules(
    @Req() req: { user: { merchantId: string } },
    @Query() queryParams: ListShippingRulesQueryDto, // Use defined DTO for query params
  ): Promise<ShippingRuleDto[]> {
    const merchantId = req.user.merchantId;
    this.logger.log(`Listing shipping rules for merchant ${merchantId} with query: ${JSON.stringify(queryParams)}`);
    // Pass queryParams to service if it supports filtering/pagination
    const ruleEntities = await this.shippingRuleService.listRulesByMerchant(merchantId);
    return ruleEntities.map(this.mapEntityToDto);
  }
}