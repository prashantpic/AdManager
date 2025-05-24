import { AppInstallationEntity } from '../installation/entities/app-installation.entity';
import { PaginationQueryDto } from '../../application/dtos/common/pagination-query.dto';
import { PaginatedResult } from './app.repository.interface';

export interface IAppInstallationRepository {
  findById(id: string): Promise<AppInstallationEntity | null>;
  findByMerchantId(merchantId: string, pagination?: PaginationQueryDto): Promise<PaginatedResult<AppInstallationEntity>>;
  findByAppAndMerchantId(
    appId: string,
    merchantId: string,
  ): Promise<AppInstallationEntity | null>;
  save(installation: AppInstallationEntity): Promise<AppInstallationEntity>;
  delete(id: string): Promise<void>;
}