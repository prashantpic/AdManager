import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AppDiscoveryService,
  AppInstallationService,
  AppSubscriptionManagementService,
  AppRatingReviewService,
  AppListingDto,
  AppDetailDto,
  InstallAppDto,
  AppInstallationDto,
  SubscribeAppDto,
  AppMerchantSubscriptionDto,
  SubmitRatingReviewDto,
  AppRatingReviewDto,
  PaginationQueryDto,
  SearchFilterQueryDto,
} from '../../application';
import { MerchantGuard } from '../guards/merchant.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('merchant/apps')
@UseGuards(MerchantGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AppStoreMerchantController {
  constructor(
    private readonly appDiscoveryService: AppDiscoveryService,
    private readonly appInstallationService: AppInstallationService,
    private readonly appSubscriptionManagementService: AppSubscriptionManagementService,
    private readonly appRatingReviewService: AppRatingReviewService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async searchAndFilterApps(
    @Query() searchFilterQueryDto: SearchFilterQueryDto,
    // PaginationQueryDto is often part of SearchFilterQueryDto or a separate mixin
  ): Promise<AppListingDto[]> {
    return this.appDiscoveryService.findPublishedApps(searchFilterQueryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getAppDetails(
    @Param('id', ParseUUIDPipe) appId: string,
  ): Promise<AppDetailDto> {
    return this.appDiscoveryService.findAppDetailById(appId);
  }

  @Post(':id/install')
  @HttpCode(HttpStatus.CREATED)
  async installApp(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) appId: string,
    @Body() installAppDto: InstallAppDto,
  ): Promise<AppInstallationDto> {
    const merchantId = req.user.id; // Assuming merchant ID is on req.user
    // The InstallAppDto from SDS doesn't have appId, but the path does.
    // Assuming installAppDto might contain configuration, and appId is taken from param.
    return this.appInstallationService.installApp(merchantId, { ...installAppDto, appId });
  }

  @Delete('/installations/:installationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async uninstallApp(
    @Req() req: AuthenticatedRequest,
    @Param('installationId', ParseUUIDPipe) installationId: string,
  ): Promise<void> {
    const merchantId = req.user.id;
    return this.appInstallationService.uninstallApp(merchantId, installationId);
  }

  @Get('/installations')
  @HttpCode(HttpStatus.OK)
  async getMerchantInstallations(
    @Req() req: AuthenticatedRequest,
  ): Promise<AppInstallationDto[]> {
    const merchantId = req.user.id;
    return this.appInstallationService.getMerchantInstallations(merchantId);
  }

  @Post(':id/subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribeToApp(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) appId: string,
    @Body() subscribeAppDto: SubscribeAppDto,
  ): Promise<AppMerchantSubscriptionDto> {
    const merchantId = req.user.id;
     // subscribeAppDto might contain installationId if subscription is tied to an existing installation
     // or appId is used to find/create installation first. SDS service method for AppSubscriptionManagementService
     // is subscribeToApp(merchantId: string, dto: SubscribeAppDto): Promise<AppMerchantSubscriptionDto>
     // but the controller route has appId. Assuming dto has appId or it is derived.
    return this.appSubscriptionManagementService.subscribeToApp(merchantId, { ...subscribeAppDto, appId });
  }

  @Delete('/subscriptions/:subscriptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeFromApp(
    @Req() req: AuthenticatedRequest,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
  ): Promise<void> {
    const merchantId = req.user.id;
    return this.appSubscriptionManagementService.cancelSubscription(merchantId, subscriptionId);
  }

  @Get('/subscriptions')
  @HttpCode(HttpStatus.OK)
  async getMerchantSubscriptions(
    @Req() req: AuthenticatedRequest,
  ): Promise<AppMerchantSubscriptionDto[]> {
    const merchantId = req.user.id;
    return this.appSubscriptionManagementService.getMerchantSubscriptions(merchantId);
  }

  @Post(':appId/reviews')
  @HttpCode(HttpStatus.CREATED)
  async submitReview(
    @Req() req: AuthenticatedRequest,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() submitRatingReviewDto: SubmitRatingReviewDto,
  ): Promise<AppRatingReviewDto> {
    const merchantId = req.user.id;
    return this.appRatingReviewService.submitRatingReview(merchantId, appId, submitRatingReviewDto);
  }

  @Get(':appId/reviews')
  @HttpCode(HttpStatus.OK)
  async getAppReviews(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<AppRatingReviewDto[]> {
    return this.appRatingReviewService.getAppRatingReviews(appId, paginationQueryDto);
  }
}