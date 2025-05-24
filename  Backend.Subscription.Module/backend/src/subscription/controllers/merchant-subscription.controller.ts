import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Inject,
  Logger,
  Req, // For accessing request object to get user
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MerchantSubscriptionService } from '../services/merchant-subscription.service';
import { BillingService } from '../services/billing.service';
import {
  ManageMerchantSubscriptionDto,
  MerchantSubscriptionResponseDto,
  ProcessRefundDto,
} from '../dtos';
import { MerchantSubscriptionMapper } from '../mappers/merchant-subscription.mapper';
import { ISubscriptionPlanRepository } from '../domain/repositories/subscription-plan.repository';
import { SubscriptionPlanMapper } from '../mappers/subscription-plan.mapper';
import { PlanNotFoundException } from '../common/exceptions/plan-not-found.exception';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface'; // Placeholder
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Placeholder for AuthGuard and AdminAuthGuard. In a real app, these would be imported.
// import { AuthGuard } from '../../user-auth/guards/auth.guard';
// import { AdminAuthGuard } from '../../user-auth/guards/admin-auth.guard';
const AuthGuard = () => ({}); // Mock guard for compilation
const AdminAuthGuard = () => ({}); // Mock guard for compilation

// Placeholder for @User decorator
const User = (): ParameterDecorator => (target: any, key, index) => {
  // In a real app, this would use ExecutionContext to extract user from request
  // For now, we'll assume the request object itself has a 'user' property
  // This is a simplification. Proper implementation uses `createParamDecorator`.
};

@ApiTags('Merchant Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class MerchantSubscriptionController {
  private readonly logger = new Logger(MerchantSubscriptionController.name);

  constructor(
    private readonly merchantSubscriptionService: MerchantSubscriptionService,
    private readonly billingService: BillingService,
    private readonly subscriptionMapper: MerchantSubscriptionMapper,
    @Inject('ISubscriptionPlanRepository')
    private readonly planRepository: ISubscriptionPlanRepository,
    private readonly planMapper: SubscriptionPlanMapper,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Subscribe merchant to a plan' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MerchantSubscriptionResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or merchant already subscribed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Plan not found' })
  async subscribe(
    @User() user: AuthenticatedUser,
    @Body() dto: ManageMerchantSubscriptionDto,
    @Req() request: any, // Accessing NestJS request object
  ): Promise<MerchantSubscriptionResponseDto> {
    const authUser = request.user as AuthenticatedUser; // Assuming user is attached by AuthGuard
    if (!authUser || !authUser.merchantId) {
        throw new BadRequestException('Authenticated user or merchant ID not found.');
    }
    this.logger.log(`Merchant ${authUser.merchantId} attempting to subscribe to plan ${dto.planId}`);
    if (!dto.paymentMethodToken) {
        throw new BadRequestException('Payment method token is required for a new subscription.');
    }

    const subscriptionAggregate =
      await this.merchantSubscriptionService.subscribeMerchant(authUser.merchantId, dto);

    const planAggregate = await this.planRepository.findById(
      subscriptionAggregate.planId,
    );
    if (!planAggregate) {
      this.logger.error(`Plan ${subscriptionAggregate.planId} not found for new subscription ${subscriptionAggregate.id}`);
      throw new PlanNotFoundException(subscriptionAggregate.planId);
    }
    this.logger.log(`Merchant ${authUser.merchantId} subscribed successfully to plan ${dto.planId}. Subscription ID: ${subscriptionAggregate.id}`);
    return this.subscriptionMapper.toDto(subscriptionAggregate, planAggregate);
  }

  @Put(':subscriptionId/plan') // Changed endpoint as per SDS
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Change merchant's subscription plan" })
  @ApiParam({ name: 'subscriptionId', description: 'The ID of the merchant subscription' })
  @ApiResponse({ status: HttpStatus.OK, type: MerchantSubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or plan cannot be changed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription or new plan not found' })
  async changePlan(
    @User() user: AuthenticatedUser,
    @Param('subscriptionId') subId: string,
    @Body() dto: ManageMerchantSubscriptionDto,
    @Req() request: any,
  ): Promise<MerchantSubscriptionResponseDto> {
    const authUser = request.user as AuthenticatedUser;
     if (!authUser || !authUser.merchantId) {
        throw new BadRequestException('Authenticated user or merchant ID not found.');
    }
    this.logger.log(`Merchant ${authUser.merchantId} attempting to change plan for subscription ${subId} to plan ${dto.planId}`);
    
    // Validate ownership
    const currentSubscription = await this.merchantSubscriptionService.getSubscriptionById(subId);
    if (!currentSubscription || currentSubscription.merchantId !== authUser.merchantId) {
        this.logger.warn(`Merchant ${authUser.merchantId} tried to access unauthorized subscription ${subId}`);
        throw new NotFoundException(`Subscription with ID "${subId}" not found or access denied.`);
    }

    const updatedSubscriptionAggregate =
      await this.merchantSubscriptionService.changeMerchantPlan(subId, dto);

    const newPlanAggregate = await this.planRepository.findById(
      updatedSubscriptionAggregate.planId,
    );
    if (!newPlanAggregate) {
      this.logger.error(`New plan ${updatedSubscriptionAggregate.planId} not found for subscription ${updatedSubscriptionAggregate.id}`);
      throw new PlanNotFoundException(updatedSubscriptionAggregate.planId);
    }
    this.logger.log(`Subscription ${subId} plan changed successfully to ${dto.planId}`);
    return this.subscriptionMapper.toDto(
      updatedSubscriptionAggregate,
      newPlanAggregate,
    );
  }

  @Post(':subscriptionId/cancel') // Changed to POST as per SDS, though DELETE might be more RESTful semantically for cancellation
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancel merchant's subscription" })
  @ApiParam({ name: 'subscriptionId', description: 'The ID of the merchant subscription to cancel' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Subscription already cancelled or cannot be cancelled' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  async cancel(
    @User() user: AuthenticatedUser,
    @Param('subscriptionId') subId: string,
    @Req() request: any,
  ): Promise<void> {
    const authUser = request.user as AuthenticatedUser;
     if (!authUser || !authUser.merchantId) {
        throw new BadRequestException('Authenticated user or merchant ID not found.');
    }
    this.logger.log(`Merchant ${authUser.merchantId} attempting to cancel subscription ${subId}`);

    // Validate ownership
    const currentSubscription = await this.merchantSubscriptionService.getSubscriptionById(subId);
    if (!currentSubscription || currentSubscription.merchantId !== authUser.merchantId) {
        this.logger.warn(`Merchant ${authUser.merchantId} tried to access unauthorized subscription ${subId} for cancellation`);
        throw new NotFoundException(`Subscription with ID "${subId}" not found or access denied.`);
    }

    await this.merchantSubscriptionService.cancelSubscription(subId);
    this.logger.log(`Subscription ${subId} cancelled successfully`);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get authenticated merchant's subscription" })
  @ApiResponse({ status: HttpStatus.OK, type: MerchantSubscriptionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found for merchant' })
  async getMySubscription(
    @User() user: AuthenticatedUser,
    @Req() request: any,
    ): Promise<MerchantSubscriptionResponseDto> {
    const authUser = request.user as AuthenticatedUser;
     if (!authUser || !authUser.merchantId) {
        throw new BadRequestException('Authenticated user or merchant ID not found.');
    }
    this.logger.log(`Attempting to retrieve subscription for merchant ${authUser.merchantId}`);
    const subscriptionAggregate =
      await this.merchantSubscriptionService.getSubscriptionByMerchantId(
        authUser.merchantId,
      );

    if (!subscriptionAggregate) {
      this.logger.warn(`Subscription not found for merchant ${authUser.merchantId}`);
      throw new NotFoundException(`Subscription not found for merchant.`);
    }

    const planAggregate = await this.planRepository.findById(
      subscriptionAggregate.planId,
    );
    if (!planAggregate) {
      this.logger.error(`Plan ${subscriptionAggregate.planId} not found for merchant's subscription ${subscriptionAggregate.id}`);
      throw new PlanNotFoundException(subscriptionAggregate.planId);
    }
    this.logger.log(`Subscription for merchant ${authUser.merchantId} retrieved successfully. Subscription ID: ${subscriptionAggregate.id}`);
    return this.subscriptionMapper.toDto(subscriptionAggregate, planAggregate);
  }

  @Post('admin/refund')
  @UseGuards(AdminAuthGuard)
  @HttpCode(HttpStatus.OK) // Changed from NO_CONTENT to OK, as it's an action.
  @ApiOperation({ summary: '[ADMIN] Process a refund for a subscription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Refund processed (or initiated) successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid refund request or refund failed' })
  async adminProcessRefund(
    @Body() dto: ProcessRefundDto,
  ): Promise<void> { // Or return a DTO with refund status
    this.logger.log(`Admin attempting to process refund for subscription ${dto.subscriptionId}`);
    await this.billingService.processRefund(dto);
    this.logger.log(`Refund for subscription ${dto.subscriptionId} processed (or initiated)`);
  }
}