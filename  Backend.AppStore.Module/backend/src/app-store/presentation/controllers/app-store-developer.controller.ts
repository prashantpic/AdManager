import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import {
  AppCrudService,
  AppSubmissionService,
  SubmitAppDto,
  AppSubmissionDto,
  AppDto,
  UpdateAppDto,
  CreateAppVersionDto,
  AppVersionDto,
  PaginationQueryDto,
} from '../../application';
import { DeveloperGuard } from '../guards/developer.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('developer/apps')
@UseGuards(DeveloperGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AppStoreDeveloperController {
  constructor(
    private readonly appCrudService: AppCrudService,
    private readonly appSubmissionService: AppSubmissionService,
  ) {}

  @Post('/submit')
  @HttpCode(HttpStatus.CREATED)
  async submitApp(
    @Req() req: AuthenticatedRequest,
    @Body() submitAppDto: SubmitAppDto,
  ): Promise<AppSubmissionDto> {
    const developerId = req.user.id; // Assuming developer ID is on req.user
    return this.appSubmissionService.submitApp(developerId, submitAppDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDeveloperAppDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) appId: string,
  ): Promise<AppDto> {
    const developerId = req.user.id;
    // AppCrudService.getAppById needs to be enhanced or a new method
    // in AppCrudService or AppDiscoveryService to check developer ownership.
    return this.appCrudService.findAppByIdForDeveloper(appId, developerId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateDeveloperAppDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) appId: string,
    @Body() updateAppDto: UpdateAppDto,
  ): Promise<AppDto> {
    const developerId = req.user.id;
    // AppCrudService.updateApp needs to be enhanced to check developer ownership.
    return this.appCrudService.updateAppForDeveloper(appId, developerId, updateAppDto);
  }

  @Post(':appId/versions')
  @HttpCode(HttpStatus.CREATED)
  async addAppVersion(
    @Req() req: AuthenticatedRequest,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() createAppVersionDto: CreateAppVersionDto,
  ): Promise<AppVersionDto> {
    const developerId = req.user.id;
    // AppCrudService.addAppVersion needs to check developer ownership of the app.
    // This might better fit AppSubmissionService if new versions also go through submission.
    // As per SDS, AppCrudService.addAppVersion is listed.
    return this.appCrudService.addAppVersionForDeveloper(appId, developerId, createAppVersionDto);
  }

  @Get('/submissions')
  @HttpCode(HttpStatus.OK)
  async getDeveloperSubmissions(
    @Req() req: AuthenticatedRequest,
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<AppSubmissionDto[]> {
    const developerId = req.user.id;
    return this.appSubmissionService.getDeveloperSubmissions(developerId, paginationQueryDto);
  }
}