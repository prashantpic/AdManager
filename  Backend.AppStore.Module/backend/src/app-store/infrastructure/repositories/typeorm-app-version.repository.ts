import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AppVersionEntity, IAppVersionRepository } from '../../domain';
import { AppReviewStatus } from '../../common/enums';

@Injectable()
export class TypeOrmAppVersionRepository implements IAppVersionRepository {
  constructor(
    @InjectRepository(AppVersionEntity)
    private readonly versionOrmRepository: Repository<AppVersionEntity>,
  ) {}

  async findById(id: string): Promise<AppVersionEntity | null> {
    return this.versionOrmRepository.findOne({ where: { id }, relations: ['app'] });
  }
  
  async findByIdAndDeveloperId(id: string, developerId: string): Promise<AppVersionEntity | null> {
    return this.versionOrmRepository.findOne({ 
        where: { id, app: { developerId } }, // Query through relation
        relations: ['app'] 
    });
  }

  async findByAppId(appId: string): Promise<AppVersionEntity[]> {
    return this.versionOrmRepository.find({ where: { appId }, relations: ['app'], order: { submissionDate: 'DESC' } });
  }

  async findLatestByAppId(appId: string): Promise<AppVersionEntity | null> {
    return this.versionOrmRepository.findOne({
      where: { appId },
      order: { submissionDate: 'DESC' }, // Or version number semantically if possible
      relations: ['app'],
    });
  }
  
  async findActiveVersionsByAppId(appId: string): Promise<AppVersionEntity[]> {
    return this.versionOrmRepository.find({
        where: { appId, isActive: true },
        relations: ['app'],
        order: { releaseDate: 'DESC'}
    });
  }

  async hasOtherApprovedVersions(appId: string, excludeVersionId?: string): Promise<boolean> {
    const query = {
        appId,
        reviewStatus: AppReviewStatus.APPROVED,
        isActive: true, // typically approved means active or ready to be active
    };
    if (excludeVersionId) {
        query['id'] = Not(excludeVersionId);
    }
    const count = await this.versionOrmRepository.count({ where: query });
    return count > 0;
  }
  
  async deactivateOtherVersions(appId: string, activeVersionId: string): Promise<void> {
      await this.versionOrmRepository.update(
          { appId, id: Not(activeVersionId), isActive: true },
          { isActive: false }
      );
  }

  async save(version: AppVersionEntity): Promise<AppVersionEntity> {
    return this.versionOrmRepository.save(version);
  }

  async delete(id: string): Promise<void> {
    await this.versionOrmRepository.delete(id);
  }
}