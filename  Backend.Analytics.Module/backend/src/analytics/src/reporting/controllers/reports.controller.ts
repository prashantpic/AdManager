import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  StreamableFile,
  ParseUUIDPipe,
  Query,
  Logger,
  ValidationPipe
} from '@nestjs/common';
import { ReportGenerationService } from '../services/report-generation.service';
import { ReportRequestDto } from '../../common/dtos/report-request.dto';
import { ReportResponseDto } from '../../common/dtos/report-response.dto';
import { ReportConfigurationDto } from '../../common/dtos/report-configuration.dto';
import { IPredefinedReportTemplate } from '../templates/predefined-report.interface';
// import { AuthGuard } from '@nestjs/passport'; // Assuming AuthGuard is from @nestjs/passport or custom
import { AuthGuard } from '../../../../core/guards/auth.guard'; // Placeholder for actual AuthGuard path
import { AuthenticatedUser, User } from '../../../../core/decorators/user.decorator'; // Placeholder path

/**
 * API controller for report generation, management of saved configurations, and listing predefined templates.
 */
@Controller('analytics/reports')
@UseGuards(AuthGuard) // Apply AuthGuard to all routes in this controller
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportGenerationService: ReportGenerationService) {}

  /**
   * Generates a report based on user criteria.
   */
  @Post('generate')
  async generateReport(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) reportRequestDto: ReportRequestDto,
    @User() authUser: AuthenticatedUser,
  ): Promise<ReportResponseDto | StreamableFile> {
    this.logger.log(`Generating report for merchant ${authUser.merchantId}, type: ${reportRequestDto.reportType}`);
    try {
      const result = await this.reportGenerationService.generateReport(reportRequestDto, authUser.merchantId);
      if (result instanceof Buffer) {
        // Determine content type based on exportFormat (simplified)
        let contentType = 'application/octet-stream';
        if (reportRequestDto.exportFormat === 'csv') contentType = 'text/csv';
        if (reportRequestDto.exportFormat === 'xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        // Headers for file download
        // const headers = {
        //   'Content-Type': contentType,
        //   'Content-Disposition': `attachment; filename="report.${reportRequestDto.exportFormat || 'bin'}"`,
        // };
        // For NestJS StreamableFile, headers are set on the StreamableFile instance or response object directly
        return new StreamableFile(result); // NestJS will handle headers if properly configured in service for StreamableFile
      }
      return result as ReportResponseDto;
    } catch (error) {
        this.logger.error(`Error generating report for merchant ${authUser.merchantId}: ${error.message}`, error.stack);
        throw error; // Rethrow to be handled by global exception filter
    }
  }

  /**
   * Retrieves saved report configurations for the user.
   */
  @Get('configurations')
  async getSavedReportConfigurations(
    @User() authUser: AuthenticatedUser,
  ): Promise<ReportConfigurationDto[]> {
    this.logger.log(`Fetching saved report configurations for merchant ${authUser.merchantId}`);
    return this.reportGenerationService.getSavedReportConfigurations(authUser.merchantId);
  }

  /**
   * Saves a new report configuration for the user.
   */
  @Post('configurations')
  async saveReportConfiguration(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) configDto: ReportConfigurationDto,
    @User() authUser: AuthenticatedUser,
  ): Promise<ReportConfigurationDto> {
    this.logger.log(`Saving report configuration for merchant ${authUser.merchantId}, name: ${configDto.name}`);
    // Ensure the merchantId from the token is used, overriding any in DTO for security
    configDto.merchantId = authUser.merchantId;
    return this.reportGenerationService.saveReportConfiguration(configDto, authUser.merchantId);
  }

  /**
   * Retrieves a specific saved report configuration.
   */
  @Get('configurations/:id')
  async getReportConfigurationById(
    @Param('id', ParseUUIDPipe) id: string,
    @User() authUser: AuthenticatedUser,
  ): Promise<ReportConfigurationDto> {
    this.logger.log(`Fetching report configuration by ID ${id} for merchant ${authUser.merchantId}`);
    return this.reportGenerationService.getReportConfigurationById(id, authUser.merchantId);
  }

  /**
   * Updates an existing saved report configuration.
   */
  @Put('configurations/:id')
  async updateReportConfiguration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) configDto: ReportConfigurationDto,
    @User() authUser: AuthenticatedUser,
  ): Promise<ReportConfigurationDto> {
    this.logger.log(`Updating report configuration ID ${id} for merchant ${authUser.merchantId}`);
    // Ensure the merchantId from the token is used
    configDto.merchantId = authUser.merchantId;
    return this.reportGenerationService.updateReportConfiguration(id, configDto, authUser.merchantId);
  }

  /**
   * Deletes a saved report configuration.
   */
  @Delete('configurations/:id')
  async deleteReportConfiguration(
    @Param('id', ParseUUIDPipe) id: string,
    @User() authUser: AuthenticatedUser,
  ): Promise<void> {
    this.logger.log(`Deleting report configuration ID ${id} for merchant ${authUser.merchantId}`);
    await this.reportGenerationService.deleteReportConfiguration(id, authUser.merchantId);
  }

  /**
   * Lists available predefined report templates.
   */
  @Get('templates')
  async getPredefinedReportTemplates(): Promise<IPredefinedReportTemplate[]> {
    this.logger.log('Fetching predefined report templates.');
    return this.reportGenerationService.getPredefinedReportTemplates();
  }
}