import {
  Controller,
  Post,
  Get,
  Put,
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
  AppCrudService,
  AppReviewService,
  AppRatingReviewService,
  CreateAppCategoryDto,
  AppCategoryDto,
  AppSubmissionDto,
  UpdateReviewStatusDto,
  AppReviewDto,
  AppRatingReviewDto,
  PaginationQueryDto,
} from '../../application';
import { AdminGuard } from '../guards/admin.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('admin/apps')
@UseGuards(AdminGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AppStoreAdminController {
  constructor(
    private readonly appCrudService: AppCrudService,
    private readonly appReviewService: AppReviewService,
    private readonly appRatingReviewService: AppRatingReviewService,
  ) {}

  @Post('/categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() createAppCategoryDto: CreateAppCategoryDto,
  ): Promise<AppCategoryDto> {
    return this.appCrudService.createAppCategory(createAppCategoryDto);
  }

  @Get('/categories')
  @HttpCode(HttpStatus.OK)
  async getAllCategories(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<AppCategoryDto[]> {
    return this.appCrudService.findAllAppCategories(paginationQueryDto);
  }

  @Get('/submissions')
  @HttpCode(HttpStatus.OK)
  async getAllSubmissionsForReview(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<AppSubmissionDto[]> {
    // AppReviewService.getPendingSubmissions needs to accept pagination
    return this.appReviewService.getPendingSubmissions(paginationQueryDto);
  }
  
  // The path /reviews/:id/status suggests 'id' is a review ID (AppReviewProcessEntity.id)
  @Put('/reviews/:reviewId/status')
  @HttpCode(HttpStatus.OK)
  async updateReviewStatus(
    @Req() req: AuthenticatedRequest,
    @Param('reviewId', ParseUUIDPipe) reviewId: string, // This is AppReviewProcessEntity.id
    @Body() updateReviewStatusDto: UpdateReviewStatusDto,
  ): Promise<AppReviewDto> {
    const adminUserId = req.user.id;
    return this.appReviewService.updateReviewStatus(reviewId, updateReviewStatusDto, adminUserId);
  }

  // The path /reviews/:id/moderate suggests 'id' is an AppRatingReviewEntity.id
  @Put('/reviews/:ratingReviewId/moderate')
  @HttpCode(HttpStatus.OK)
  async moderateReview(
    @Req() req: AuthenticatedRequest,
    @Param('ratingReviewId', ParseUUIDPipe) ratingReviewId: string, // This is AppRatingReviewEntity.id
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ): Promise<AppRatingReviewDto> {
    const adminUserId = req.user.id;
    return this.appRatingReviewService.moderateReview(ratingReviewId, body.status, adminUserId);
  }
}