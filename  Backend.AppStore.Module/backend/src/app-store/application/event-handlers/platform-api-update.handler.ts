import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter'; // Assuming use of @nestjs/event-emitter
import { AppCompatibilityService, IAppRepository, IAppVersionRepository } from '../../domain'; // Domain Service
import { NotificationClient } from '../../infrastructure/clients';

// Conceptual event structure
export class PlatformApiUpdatedEvent {
  constructor(
    public readonly platformName: string,
    public readonly newVersion: string,
    public readonly affectedApiEndpoints?: string[], // Optional details
  ) {}
}

export const PLATFORM_API_UPDATED_EVENT_NAME = 'platform.api.updated';

@Injectable()
export class PlatformApiUpdateHandler {
  private readonly logger = new Logger(PlatformApiUpdateHandler.name);

  constructor(
    private readonly appCompatibilityService: AppCompatibilityService,
    @Inject('IAppRepository') private readonly appRepository: IAppRepository, // To find apps that need checking
    @Inject('IAppVersionRepository') private readonly appVersionRepository: IAppVersionRepository, // To find versions
    private readonly notificationClient: NotificationClient,
  ) {}

  @OnEvent(PLATFORM_API_UPDATED_EVENT_NAME)
  async handlePlatformApiUpdate(event: PlatformApiUpdatedEvent): Promise<void> {
    this.logger.log(`Received PlatformApiUpdatedEvent for ${event.platformName}, new version: ${event.newVersion}`);

    // REQ-8-006: Trigger compatibility checks for relevant apps.
    // "Relevant apps" could mean all published apps, or apps using specific APIs if event is detailed.
    // For simplicity, let's assume we check all active versions of published apps.

    const publishedApps = await this.appRepository.findAllPublishedApps({}); // Assuming a method to get all published apps
    
    for (const app of publishedApps) {
      const activeVersions = await this.appVersionRepository.findActiveVersionsByAppId(app.id); // Needs method in repo
      for (const version of activeVersions) {
        try {
          this.logger.log(`Checking compatibility for app ${app.name} version ${version.versionNumber}`);
          const compatibilityResult = await this.appCompatibilityService.checkCompatibility(version, event.newVersion); // Pass new platform version

          if (!compatibilityResult.isCompatible) {
            this.logger.warn(
              `App ${app.name} version ${version.versionNumber} is NOT compatible with platform API ${event.newVersion}. Issues: ${compatibilityResult.issues.join(', ')}`,
            );
            // Notify developer
            await this.notificationClient.sendAppCompatibilityAlert(
              app.developerId,
              app.name,
              version.versionNumber,
              `Platform API ${event.platformName} updated to ${event.newVersion}. Your app version ${version.versionNumber} has compatibility issues: ${compatibilityResult.issues.join(', ')}. Please update your app.`,
            );
            // Potentially flag the app version or app itself as needing attention.
            // This might involve updating the AppVersionEntity status or creating a notification record.
          } else {
            this.logger.log(`App ${app.name} version ${version.versionNumber} is compatible with platform API ${event.newVersion}.`);
          }
        } catch (error) {
          this.logger.error(
            `Error checking compatibility for app ${app.name} version ${version.versionNumber}: ${error.message}`,
            error.stack,
          );
        }
      }
    }
    this.logger.log('Finished processing PlatformApiUpdatedEvent.');
  }
}