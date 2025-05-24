import { Inject, Injectable } from '@nestjs/common';
import { AppVersionEntity } from '../entities/app-version.entity';
import { PlatformApiVersionClient } from '../../../infrastructure/clients/platform-api-version.client';
import { NotificationClient } from '../../../infrastructure/clients/notification.client';
import { AppReviewStatus } from '../../../common/enums/app-review-status.enum';

@Injectable()
export class AppCompatibilityService {
  constructor(
    @Inject(PlatformApiVersionClient)
    private readonly platformApiVersionClient: PlatformApiVersionClient,
    @Inject(NotificationClient)
    private readonly notificationClient: NotificationClient,
  ) {}

  async checkCompatibility(appVersion: AppVersionEntity): Promise<boolean> {
    // In a real scenario, appVersion.platformApiVersionCompatibility would likely be more structured,
    // e.g., a specific version string or a range (semver).
    const requiredVersions = Array.isArray(appVersion.platformApiVersionCompatibility)
      ? appVersion.platformApiVersionCompatibility
      : [appVersion.platformApiVersionCompatibility];

    if (!requiredVersions || requiredVersions.length === 0 || requiredVersions[0] === 'any') {
      return true; // No specific compatibility requirement
    }

    const supportedPlatformVersions =
      await this.platformApiVersionClient.getCurrentSupportedApiVersions();

    // Simple check: at least one of the required versions must be in the supported list.
    // More complex logic (e.g., semver range matching) could be implemented here.
    const isCompatible = requiredVersions.some((reqVersion) =>
      supportedPlatformVersions.includes(reqVersion),
    );

    if (!isCompatible) {
      await this.notifyDeveloperOfIncompatibility(appVersion, supportedPlatformVersions);
    }
    return isCompatible;
  }

  async notifyDeveloperOfIncompatibility(
    appVersion: AppVersionEntity,
    supportedPlatformVersions: string[],
  ): Promise<void> {
    if (!appVersion.app || !appVersion.app.developerId) {
      console.error(
        `Cannot notify developer for app version ${appVersion.id}: missing app or developerId.`,
      );
      return;
    }

    const details = `App version ${appVersion.versionNumber} (ID: ${
      appVersion.id
    }) for app "${appVersion.app.name}" (ID: ${
      appVersion.app.id
    }) requires API versions [${appVersion.platformApiVersionCompatibility.join(
      ', ',
    )}], but the platform currently supports [${supportedPlatformVersions.join(', ')}].`;

    await this.notificationClient.sendAppCompatibilityAlert(
      appVersion.app.developerId,
      appVersion.app.id,
      appVersion.versionNumber,
      details,
    );
  }

  // This method might be called by an event handler for platform API updates
  async checkAllActiveAppVersions(): Promise<void> {
    // This would involve fetching all active/published app versions
    // and then iterating through them to call checkCompatibility.
    // Example:
    // const activeVersions = await this.appVersionRepository.findAllActive();
    // for (const version of activeVersions) {
    //   await this.checkCompatibility(version);
    // }
    console.log('Checking compatibility for all active app versions - Placeholder');
  }
}