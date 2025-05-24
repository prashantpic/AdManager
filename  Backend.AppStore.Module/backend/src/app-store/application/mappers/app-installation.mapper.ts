import { Injectable } from '@nestjs/common';
import { AppInstallationEntity } from '../../domain';
import { AppInstallationDto } from '../dtos';
import { AppVersionMapper } from './app-version.mapper'; // If AppInstallationDto includes version details

@Injectable()
export class AppInstallationMapper {

  constructor(private readonly appVersionMapper: AppVersionMapper) {}

  public toDto(entity: AppInstallationEntity): AppInstallationDto {
    if (!entity) return null;
    return {
      id: entity.id,
      appId: entity.appId,
      merchantId: entity.merchantId,
      installedVersionId: entity.installedVersionId,
      installedVersion: entity.installedVersion ? this.appVersionMapper.toDto(entity.installedVersion) : undefined,
      status: entity.status,
      installationDate: entity.installationDate,
      uninstallationDate: entity.uninstallationDate,
      configuration: entity.configuration, // Value Object
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  // toEntity might not be needed here
}