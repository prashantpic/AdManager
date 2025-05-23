import { Controller, Get, Query, UseGuards, Logger, ValidationPipe } from '@nestjs/common';
import { DashboardDataService } from '../services/dashboard-data.service';
import { DashboardQueryDto } from '../../common/dtos/dashboard-query.dto';
// import { AuthGuard } from '@nestjs/passport'; // Assuming AuthGuard is from @nestjs/passport or custom
// import { AdminAuthGuard } from 'src/core/guards/admin-auth.guard'; // Placeholder for actual AdminAuthGuard path
import { AuthGuard } from '../../../../core/guards/auth.guard'; // Placeholder for actual AuthGuard path
import { AdminAuthGuard } from '../../../../core/guards/admin-auth.guard'; // Placeholder for actual AdminAuthGuard path

import { AuthenticatedUser, User, AuthenticatedAdminUser } from '../../../../core/decorators/user.decorator'; // Placeholder for actual User decorator path

/**
 * API controller for serving data to both merchant-facing analytics dashboards
 * and internal operational dashboards.
 */
@Controller('analytics/dashboards')
export class DashboardsController {
  private readonly logger = new Logger(DashboardsController.name);

  constructor(private readonly dashboardDataService: DashboardDataService) {}

  /**
   * Provides data for merchant-facing dashboards.
   */
  @Get('merchant')
  @UseGuards(AuthGuard)
  async getMerchantDashboardData(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dashboardQueryDto: DashboardQueryDto,
    @User() authUser: AuthenticatedUser,
  ): Promise<any> {
    this.logger.log(`Fetching merchant dashboard data for merchant ${authUser.merchantId}, type: ${dashboardQueryDto.dashboardType}`);
    try {
        return this.dashboardDataService.getMerchantDashboardData(dashboardQueryDto, authUser.merchantId);
    } catch (error) {
        this.logger.error(`Error fetching merchant dashboard data for merchant ${authUser.merchantId}: ${error.message}`, error.stack);
        throw error;
    }
  }

  /**
   * Provides data for internal operational dashboards for authorized administrators.
   */
  @Get('internal/operational')
  @UseGuards(AdminAuthGuard) // Requires admin privileges
  async getInternalOperationalDashboardData(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dashboardQueryDto: DashboardQueryDto,
    @User() authAdminUser: AuthenticatedAdminUser, // Assuming a decorator for admin users
  ): Promise<any> {
    this.logger.log(`Fetching internal operational dashboard data by admin ${authAdminUser.adminId}, type: ${dashboardQueryDto.dashboardType}`);
     try {
        return this.dashboardDataService.getInternalOperationalDashboardData(dashboardQueryDto, authAdminUser.role); // Pass admin role for finer control
    } catch (error) {
        this.logger.error(`Error fetching internal operational dashboard data: ${error.message}`, error.stack);
        throw error;
    }
  }
}