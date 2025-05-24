import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppInstallationEntity, IAppInstallationRepository } from '../../domain';
import { AppInstallationStatus } from '../../common/enums';

@Injectable()
export class TypeOrmAppInstallationRepository implements IAppInstallationRepository {
  constructor(
    @InjectRepository(AppInstallationEntity)
    private readonly installationOrmRepository: Repository<AppInstallationEntity>,
  ) {}

  async findById(id: string): Promise<AppInstallationEntity | null> {
    return this.installationOrmRepository.findOne({ where: { id }, relations: ['app', 'installedVersion'] });
  }
  
  async findByIdAndMerchantId(id: string, merchantId: string): Promise<AppInstallationEntity | null> {
    return this.installationOrmRepository.findOne({ where: { id, merchantId }, relations: ['app', 'installedVersion'] });
  }

  async findByMerchantId(merchantId: string): Promise<AppInstallationEntity[]> {
    return this.installationOrmRepository.find({ where: { merchantId }, relations: ['app', 'installedVersion'], order: { installationDate: 'DESC' } });
  }

  async findByAppAndMerchantId(appId: string, merchantId: string): Promise<AppInstallationEntity | null> {
    return this.installationOrmRepository.findOne({ where: { appId, merchantId }, relations: ['app', 'installedVersion'] });
  }
  
  async findByAppAndMerchantIdAndStatus(appId: string, merchantId: string, status: AppInstallationStatus): Promise<AppInstallationEntity | null> {
    return this.installationOrmRepository.findOne({ where: { appId, merchantId, status }, relations: ['app', 'installedVersion'] });
  }

  async save(installation: AppInstallationEntity): Promise<AppInstallationEntity> {
    return this.installationOrmRepository.save(installation);
  }

  async delete(id: string): Promise<void> {
    // Typically installations are marked as UNINSTALLED rather than hard deleted
    const installation = await this.findById(id);
    if (installation) {
        installation.status = AppInstallationStatus.UNINSTALLED;
        installation.uninstallationDate = new Date();
        await this.save(installation);
    }
  }
}