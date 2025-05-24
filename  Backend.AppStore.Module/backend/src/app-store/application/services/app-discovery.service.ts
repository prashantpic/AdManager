import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAppRepository, IAppRatingReviewRepository } from '../../domain';
import { AppListingDto, AppDetailDto, SearchFilterQueryDto, PaginationQueryDto } from '../dtos';
import { AppMapper } from '../mappers/app.mapper';

@Injectable()
export class AppDiscoveryService {
  constructor(
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppRatingReviewRepository')
    private readonly appRatingReviewRepository: IAppRatingReviewRepository, // For average ratings
    private readonly appMapper: AppMapper,
  ) {}

  async searchAndFilterApps(
    query: SearchFilterQueryDto,
    pagination: PaginationQueryDto,
  ): Promise<AppListingDto[]> {
    // REQ-8-001, REQ-8-014
    // Assuming IAppRepository has a method to handle complex search, filter, sort, pagination
    const { apps, totalCount } = await this.appRepository.searchAndFilterPublishedApps({
      ...query,
      ...pagination,
    });
    
    // Potentially enrich with average ratings here if not done by repository
    const appListingDtos = await Promise.all(apps.map(async app => {
        const avgRating = await this.appRatingReviewRepository.getAverageRating(app.id);
        return this.appMapper.toListingDto(app, avgRating);
    }));

    // TODO: Handle pagination response structure (e.g., return { data: appListingDtos, totalCount })
    return appListingDtos;
  }

  async getAppDetail(appId: string): Promise<AppDetailDto> {
    // REQ-8-001, REQ-8-002, REQ-8-008
    const appEntity = await this.appRepository.findPublishedByIdWithDetails(appId); // Assumes a method that fetches app with relations
    if (!appEntity) {
      throw new NotFoundException(`App with ID "${appId}" not found or not published.`);
    }
    // Fetch reviews, versions, assets etc. if not eagerly loaded or if specific logic is needed
    const reviews = await this.appRatingReviewRepository.findByAppId(appId, { status: 'APPROVED' }); // Example filter
    const avgRating = await this.appRatingReviewRepository.getAverageRating(appId);

    return this.appMapper.toDetailDto(appEntity, reviews, avgRating);
  }
}