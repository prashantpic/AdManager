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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanResponseDto,
} from '../dtos';
import { SubscriptionPlanMapper } from '../mappers/subscription-plan.mapper';
import { PlanNotFoundException } from '../common/exceptions/plan-not-found.exception';

// Placeholder for AdminAuthGuard. In a real app, this would be imported.
// import { AdminAuthGuard } from '../../user-auth/guards/admin-auth.guard';
const AdminAuthGuard = () => ({}); // Mock guard for compilation

@ApiTags('Subscription Plans (Admin)')
@ApiBearerAuth() // Assuming JWT authentication is handled globally or by API Gateway
@UseGuards(AdminAuthGuard) // Apply to all routes in this controller
@Controller('admin/subscription-plans')
export class SubscriptionPlanController {
  private readonly logger = new Logger(SubscriptionPlanController.name);

  constructor(
    private readonly planService: SubscriptionPlanService,
    private readonly planMapper: SubscriptionPlanMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The subscription plan has been successfully created.',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async create(
    @Body() createDto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    this.logger.log(`Attempting to create plan with name: ${createDto.name}`);
    const planAggregate = await this.planService.createPlan(createDto);
    this.logger.log(`Plan created successfully with ID: ${planAggregate.id}`);
    return this.planMapper.toDto(planAggregate);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all subscription plans.',
    type: [SubscriptionPlanResponseDto],
  })
  async findAll(): Promise<SubscriptionPlanResponseDto[]> {
    this.logger.log('Attempting to retrieve all plans');
    const plans = await this.planService.getAllPlans();
    this.logger.log(`Retrieved ${plans.length} plans`);
    return plans.map(plan => this.planMapper.toDto(plan));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription plan' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the subscription plan.',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription plan not found.',
  })
  async findOne(@Param('id') id: string): Promise<SubscriptionPlanResponseDto> {
    this.logger.log(`Attempting to retrieve plan with ID: ${id}`);
    const plan = await this.planService.getPlanById(id);
    if (!plan) {
      this.logger.warn(`Plan with ID: ${id} not found`);
      throw new PlanNotFoundException(id);
    }
    this.logger.log(`Plan with ID: ${id} retrieved successfully`);
    return this.planMapper.toDto(plan);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription plan to update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The subscription plan has been successfully updated.',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription plan not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    this.logger.log(`Attempting to update plan with ID: ${id}`);
    const plan = await this.planService.updatePlan(id, updateDto); // Service handles PlanNotFoundException
    this.logger.log(`Plan with ID: ${id} updated successfully`);
    return this.planMapper.toDto(plan);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription plan' })
  @ApiParam({ name: 'id', description: 'The ID of the subscription plan to delete' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The subscription plan has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription plan not found.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Attempting to delete plan with ID: ${id}`);
    await this.planService.deletePlan(id); // Service handles PlanNotFoundException
    this.logger.log(`Plan with ID: ${id} deleted successfully`);
  }
}