import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In, Brackets } from 'typeorm';
import { AppEntity, IAppRepository, AppVersionEntity } from '../../domain';
import { AppStatus, AppPricingModel } from '../../common/enums';
import { SearchFilterQueryDto, PaginationQueryDto } from '../../application/dtos';

@Injectable()
export class TypeOrmAppRepository implements IAppRepository {
  constructor(
    @InjectRepository(AppEntity)
    private readonly appOrmRepository: Repository<AppEntity>,
  ) {}

  async findById(id: string): Promise<AppEntity | null> {
    return this.appOrmRepository.findOne({ where: { id }, relations: ['categories', 'requiredPermissions', 'assets', 'versions', 'latestVersion'] });
  }

  async findByIdAndDeveloperId(id: string, developerId: string): Promise<AppEntity | null> {
    return this.appOrmRepository.findOne({ where: { id, developerId }, relations: ['categories', 'requiredPermissions', 'assets', 'versions'] });
  }
  
  async findByDeveloperId(developerId: string): Promise<AppEntity[]> {
    return this.appOrmRepository.find({ where: { developerId }, relations: ['latestVersion'] });
  }

  async findAll(): Promise<AppEntity[]> {
    return this.appOrmRepository.find({relations: ['latestVersion']});
  }
  
  async findAllPublishedApps(options: { page?: number, limit?: number }): Promise<AppEntity[]> {
      const { page = 1, limit = 10 } = options;
      return this.appOrmRepository.find({
          where: { status: AppStatus.PUBLISHED },
          relations: ['categories', 'assets', 'latestVersion'], // Eager load what's needed for listing
          skip: (page - 1) * limit,
          take: limit,
          order: { name: 'ASC' } // Default sort
      });
  }


  async searchAndFilterPublishedApps(
    params: SearchFilterQueryDto & PaginationQueryDto,
  ): Promise<{ apps: AppEntity[]; totalCount: number }> {
    const { search, categoryId, pricingModel, sortBy, sortOrder, page = 1, limit = 10 } = params;

    const queryBuilder = this.appOrmRepository.createQueryBuilder('app');

    queryBuilder.leftJoinAndSelect('app.categories', 'category');
    queryBuilder.leftJoinAndSelect('app.assets', 'asset', "asset.assetType = 'icon'"); // Only icon for listing
    queryBuilder.leftJoinAndSelect('app.latestVersion', 'latestVersion'); // For version info
    // Add join for ratings to calculate average rating if needed, or handle in service layer

    queryBuilder.where('app.status = :status', { status: AppStatus.PUBLISHED });

    if (search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('app.name ILIKE :search', { search: `%${search}%` })
            .orWhere('app.description ILIKE :search', { search: `%${search}%` });
            // .orWhere('category.name ILIKE :search', { search: `%${search}%` }); // If searching category names too
        }),
      );
    }

    if (categoryId) {
      // This requires a subquery or ensuring the join to categories is correctly filtered
      // For simplicity, if 'category' is joined, you can use:
      queryBuilder.andWhere('category.id = :categoryId', { categoryId });
    }
    
    if (pricingModel) {
      queryBuilder.andWhere('app.pricingModel = :pricingModel', { pricingModel });
    }

    if (sortBy && sortOrder) {
        // Validate sortBy to prevent SQL injection if it's user-provided and not from a fixed list
        const allowedSortByFields = ['name', 'createdAt', 'averageRating']; // 'averageRating' needs careful handling
        if (allowedSortByFields.includes(sortBy)) {
             queryBuilder.orderBy(`app.${sortBy}`, sortOrder);
        } else {
            queryBuilder.orderBy('app.name', 'ASC'); // Default sort
        }
    } else {
      queryBuilder.orderBy('app.name', 'ASC'); // Default sort
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [apps, totalCount] = await queryBuilder.getManyAndCount();
    return { apps, totalCount };
  }

  async findPublishedByIdWithDetails(id: string): Promise<AppEntity | null> {
    return this.appOrmRepository.findOne({
      where: { id, status: AppStatus.PUBLISHED },
      relations: ['categories', 'requiredPermissions', 'assets', 'versions', 'developerInfoVo', 'pricingDetailsVo', 'latestVersion'], // Add more relations as needed for detail view
    });
  }


  async save(app: AppEntity): Promise<AppEntity> {
    return this.appOrmRepository.save(app);
  }

  async delete(id: string): Promise<void> {
    // Consider soft delete or cascade options based on requirements
    await this.appOrmRepository.delete(id);
  }

  async findLatestActiveVersion(appId: string): Promise<AppVersionEntity | null> {
    // This might be better placed in AppVersionRepository or a query directly here
    const app = await this.appOrmRepository.findOne({
        where: { id: appId },
        relations: ['latestVersion']
    });
    return app?.latestVersion || null;
  }
  
  async findByIdWithPermissions(id: string): Promise<AppEntity | null> {
    return this.appOrmRepository.findOne({
        where: {id},
        relations: ['requiredPermissions']
    });
  }
}