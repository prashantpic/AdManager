import { AppVersionEntity } from '../app/entities/app-version.entity';

export interface IAppVersionRepository {
  findById(id: string): Promise<AppVersionEntity | null>;
  findByAppId(appId: string): Promise<AppVersionEntity[]>;
  findLatestByAppId(appId: string): Promise<AppVersionEntity | null>;
  findActiveVersionByAppId(appId: string): Promise<AppVersionEntity | null>;
  findByAppIdAndVersionNumber(appId: string, versionNumber: string): Promise<AppVersionEntity | null>;
  save(version: AppVersionEntity): Promise<AppVersionEntity>;
  findAllActive(): Promise<AppVersionEntity[]>; // For AppCompatibilityService
}