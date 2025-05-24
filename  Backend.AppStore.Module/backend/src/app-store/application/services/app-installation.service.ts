import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IAppRepository,
  IAppInstallationRepository,
  IAppMerchantSubscriptionRepository, // For checking subscriptions on uninstall
  AppEntity,
  AppInstallationEntity,
  InstallationConfig,
} from '../../domain';
import { AppSubscriptionManagementService } from './app-subscription-management.service';
// import { EntitlementClient } from '../../infrastructure/clients'; // Conceptual
import { InstallAppDto, UninstallAppDto, AppInstallationDto } from '../dtos';
import { AppInstallationMapper } from '../mappers/app-installation.mapper';
import { AppStatus, AppPricingModel, AppInstallationStatus } from '../../common/enums';
import { AppNotFoundException, AppOperationException } from '../../common/exceptions';

interface EntitlementClient { // Placeholder
    grantPermissions(merchantId: string, appId: string, permissions: string[]): Promise<void>;
    revokePermissions(merchantId: string, appId: string, permissions: string[]): Promise<void>;
}

@Injectable()
export class AppInstallationService {
  constructor(
    @Inject('IAppRepository')
    private readonly appRepository: IAppRepository,
    @Inject('IAppInstallationRepository')
    private readonly appInstallationRepository: IAppInstallationRepository,
    @Inject('IAppMerchantSubscriptionRepository')
    private readonly appMerchantSubscriptionRepository: IAppMerchantSubscriptionRepository,
    private readonly appSubscriptionManagementService: AppSubscriptionManagementService,
    // @Inject('EntitlementClient') private readonly entitlementClient: EntitlementClient, // Placeholder
    private readonly appInstallationMapper: AppInstallationMapper,
  ) {}

  async installApp(merchantId: string, dto: InstallAppDto): Promise<AppInstallationDto> {
    // REQ-8-009
    const app = await this.appRepository.findByIdWithPermissions(dto.appId); // Fetch with permissions
    if (!app || app.status !== AppStatus.PUBLISHED) {
      throw new AppNotFoundException(`App with ID "${dto.appId}" not found or not published.`);
    }

    const existingInstallation = await this.appInstallationRepository.findByAppAndMerchantId(dto.appId, merchantId);
    if (existingInstallation && existingInstallation.status === AppInstallationStatus.INSTALLED) {
      throw new AppOperationException(`App "${app.name}" is already installed.`);
    }
    
    // If previously uninstalled, we might reactivate or create new. For now, let's assume create new if not INSTALLED.
    if (existingInstallation && existingInstallation.status !== AppInstallationStatus.UNINSTALLED) {
         throw new AppOperationException(`App "${app.name}" is currently in status: ${existingInstallation.status}.`);
    }


    const installationEntity = new AppInstallationEntity();
    installationEntity.appId = app.id;
    installationEntity.app = app;
    installationEntity.merchantId = merchantId;
    installationEntity.status = AppInstallationStatus.INSTALLING;
    installationEntity.installationDate = new Date();
    installationEntity.configuration = dto.configuration ? new InstallationConfig(dto.configuration) : new InstallationConfig({});
    // Use the latest active version for installation
    const latestVersion = await this.appRepository.findLatestActiveVersion(app.id);
    if (!latestVersion) {
        throw new AppOperationException(`No active version found for app "${app.name}".`);
    }
    installationEntity.installedVersionId = latestVersion.id;
    installationEntity.installedVersion = latestVersion;


    let savedInstallation = await this.appInstallationRepository.save(installationEntity);

    try {
      if (app.pricingModel !== AppPricingModel.FREE) {
        // This will handle payment and subscription record creation via PlatformBillingClient
        // The subscribeToApp method might need installationId or a way to link subscription
        await this.appSubscriptionManagementService.subscribeToApp(merchantId, savedInstallation.id, {
            appId: app.id,
            // billingCycle needs to be determined or passed in DTO if multiple options
            // For now, assume a default or that pricingDetails on AppEntity contains it
            billingCycle: app.pricingDetails?.billingCycle || 'MONTHLY', // Example
        });
      }

      // Grant permissions (conceptual)
      // const permissionsToGrant = app.requiredPermissions.map(p => p.permissionName);
      // await this.entitlementClient.grantPermissions(merchantId, app.id, permissionsToGrant);

      savedInstallation.status = AppInstallationStatus.INSTALLED;
      savedInstallation = await this.appInstallationRepository.save(savedInstallation);
      return this.appInstallationMapper.toDto(savedInstallation);

    } catch (error) {
      savedInstallation.status = AppInstallationStatus.FAILED_INSTALL;
      await this.appInstallationRepository.save(savedInstallation);
      if (error instanceof AppOperationException || error instanceof AppNotFoundException) throw error;
      throw new AppOperationException(`Failed to install app "${app.name}": ${error.message}`);
    }
  }

  async uninstallApp(merchantId: string, installationId: string): Promise<void> {
    // REQ-8-009
    const installation = await this.appInstallationRepository.findByIdAndMerchantId(installationId, merchantId);
    if (!installation) {
      throw new NotFoundException(`Installation with ID "${installationId}" not found for this merchant.`);
    }

    if (installation.status === AppInstallationStatus.UNINSTALLED) {
        throw new AppOperationException('App is already uninstalled.');
    }
    if (installation.status === AppInstallationStatus.UNINSTALLING) {
        throw new AppOperationException('App uninstallation is already in progress.');
    }

    installation.status = AppInstallationStatus.UNINSTALLING;
    await this.appInstallationRepository.save(installation);

    try {
      // Cancel active subscription, if any
      const activeSubscription = await this.appMerchantSubscriptionRepository.findActiveByInstallationId(installation.id);
      if (activeSubscription) {
        await this.appSubscriptionManagementService.unsubscribeFromApp(merchantId, activeSubscription.id);
      }

      // Revoke permissions (conceptual)
      // const app = await this.appRepository.findByIdWithPermissions(installation.appId);
      // if (app) {
      //   const permissionsToRevoke = app.requiredPermissions.map(p => p.permissionName);
      //   await this.entitlementClient.revokePermissions(merchantId, app.id, permissionsToRevoke);
      // }
      
      installation.uninstallationDate = new Date();
      installation.status = AppInstallationStatus.UNINSTALLED;
      await this.appInstallationRepository.save(installation);

    } catch (error) {
        installation.status = AppInstallationStatus.FAILED_UNINSTALL; // Or revert to INSTALLED if critical failure
        await this.appInstallationRepository.save(installation);
        throw new AppOperationException(`Failed to uninstall app: ${error.message}`);
    }
  }

  async getMerchantInstallations(merchantId: string): Promise<AppInstallationDto[]> {
    // REQ-8-009
    const installations = await this.appInstallationRepository.findByMerchantId(merchantId);
    return installations.map(inst => this.appInstallationMapper.toDto(inst));
  }
}