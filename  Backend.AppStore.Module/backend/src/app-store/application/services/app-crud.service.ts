import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IAppRepository,
  IAppVersionRepository,
  IAppCategoryRepository,
  AppEntity,
  AppVersionEntity,
  AppCategoryEntity,
} from '../../domain';
import {
  CreateAppDto,
  UpdateAppDto,
  AppDto,
  CreateAppVersionDto,
  AppVersionDto,
  CreateAppCategoryDto,
  AppCategoryDto,
} from '../dtos';
import { AppMapper } from '../mappers/app.mapper';
// Assuming mappers for AppVersion and AppCategory exist or are part of AppMapper
// For simplicity, we'll assume AppMapper handles these or they are simple enough not to need separate mappers for this example

@Injectable()
export class AppCrudService {
  constructor(
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppVersionRepository')
    private readonly appVersionRepository: IAppVersionRepository,
    @Inject('IAppCategoryRepository')
    private readonly appCategoryRepository: IAppCategoryRepository,
    private readonly appMapper: AppMapper,
  ) {}

  async createApp(createAppDto: CreateAppDto, developerId: string): Promise<AppDto> {
    // Simplified: In a real scenario, you'd handle categories and permissions linking
    const appEntity = new AppEntity();
    Object.assign(appEntity, createAppDto); // Basic mapping
    appEntity.developerId = developerId;
    // appEntity.categories = await this.appCategoryRepository.findByIds(createAppDto.categoryIds);
    // appEntity.requiredPermissions = await this.permissionRepository.findByIds(createAppDto.requiredPermissionIds);
    const savedApp = await this.appRepository.save(appEntity);
    return this.appMapper.toDto(savedApp);
  }

  async updateApp(id: string, updateAppDto: UpdateAppDto, developerId: string): Promise<AppDto> {
    const appEntity = await this.appRepository.findByIdAndDeveloperId(id, developerId);
    if (!appEntity) {
      throw new NotFoundException(`App with ID "${id}" not found for this developer.`);
    }
    Object.assign(appEntity, updateAppDto); // Basic mapping
    // Handle categories and permissions update if necessary
    const updatedApp = await this.appRepository.save(appEntity);
    return this.appMapper.toDto(updatedApp);
  }

  async findAppById(id: string): Promise<AppDto | null> {
    const appEntity = await this.appRepository.findById(id);
    return appEntity ? this.appMapper.toDto(appEntity) : null;
  }

  async findAllAppsByDeveloper(developerId: string): Promise<AppDto[]> {
    const apps = await this.appRepository.findByDeveloperId(developerId);
    return apps.map(app => this.appMapper.toDto(app));
  }

  async addAppVersion(appId: string, createAppVersionDto: CreateAppVersionDto, developerId: string): Promise<AppVersionDto> {
    const appEntity = await this.appRepository.findByIdAndDeveloperId(appId, developerId);
    if (!appEntity) {
      throw new NotFoundException(`App with ID "${appId}" not found for this developer.`);
    }

    const appVersionEntity = new AppVersionEntity();
    Object.assign(appVersionEntity, createAppVersionDto);
    appVersionEntity.app = appEntity; // Link to parent app
    appVersionEntity.appId = appEntity.id;

    const savedVersion = await this.appVersionRepository.save(appVersionEntity);
    return this.appMapper.toAppVersionDto(savedVersion);
  }

  async findAppVersions(appId: string, developerId: string): Promise<AppVersionDto[]> {
     const appEntity = await this.appRepository.findByIdAndDeveloperId(appId, developerId);
     if (!appEntity) {
        throw new NotFoundException(`App with ID "${appId}" not found for this developer.`);
     }
    const versions = await this.appVersionRepository.findByAppId(appId);
    return versions.map(version => this.appMapper.toAppVersionDto(version));
  }
  
  async getAppVersionById(versionId: string, developerId: string): Promise<AppVersionDto | null> {
    const versionEntity = await this.appVersionRepository.findByIdAndDeveloperId(versionId, developerId);
    // Ensure version belongs to an app owned by the developer implicitly by checking if version exists for dev.
    return versionEntity ? this.appMapper.toAppVersionDto(versionEntity) : null;
  }

  async createAppCategory(createAppCategoryDto: CreateAppCategoryDto): Promise<AppCategoryDto> {
    const appCategoryEntity = new AppCategoryEntity();
    Object.assign(appCategoryEntity, createAppCategoryDto);
    const savedCategory = await this.appCategoryRepository.save(appCategoryEntity);
    return this.appMapper.toAppCategoryDto(savedCategory);
  }

  async updateAppCategory(id: string, updateAppCategoryDto: Partial<CreateAppCategoryDto>): Promise<AppCategoryDto> {
    const categoryEntity = await this.appCategoryRepository.findById(id);
    if (!categoryEntity) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    Object.assign(categoryEntity, updateAppCategoryDto);
    const updatedCategory = await this.appCategoryRepository.save(categoryEntity);
    return this.appMapper.toAppCategoryDto(updatedCategory);
  }
  
  async deleteAppCategory(id: string): Promise<void> {
    const result = await this.appCategoryRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
  }

  async getAppCategoryById(id: string): Promise<AppCategoryDto | null> {
    const categoryEntity = await this.appCategoryRepository.findById(id);
    return categoryEntity ? this.appMapper.toAppCategoryDto(categoryEntity) : null;
  }

  async getAllAppCategories(): Promise<AppCategoryDto[]> {
    const categories = await this.appCategoryRepository.findAll();
    return categories.map(category => this.appMapper.toAppCategoryDto(category));
  }
}