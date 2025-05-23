import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommandOutput,
} from '@aws-sdk/client-appconfigdata';
import { APPCONFIG_DATA_CLIENT } from './feature-flags.module';
import { CoreConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service'; // Assuming ICacheService is implemented by CacheService
import { IFeatureFlagsService } from './feature-flags.interface'; // Assuming this interface exists

interface AppConfigFlag {
  enabled: boolean;
  value?: any; // For flags that are more than just boolean
}

interface AppConfigFlagsStructure {
  [key: string]: AppConfigFlag | boolean; // boolean for simple flags
}

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private sessionToken: string | undefined;
  private pollIntervalSeconds: number;
  private configuration: AppConfigFlagsStructure | null = null;
  private lastPollTime: Date | null = null;
  private appConfigApplicationId: string;
  private appConfigEnvironmentId: string;
  private appConfigProfileId: string;
  private readonly cacheKeyPrefix = 'feature-flags:';

  constructor(
    @Inject(APPCONFIG_DATA_CLIENT)
    private readonly appConfigClient: AppConfigDataClient,
    private readonly configService: CoreConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.appConfigApplicationId =
      this.configService.get('APPCONFIG_APPLICATION_ID') || '';
    this.appConfigEnvironmentId =
      this.configService.get('APPCONFIG_ENVIRONMENT_ID') || '';
    this.appConfigProfileId =
      this.configService.get('APPCONFIG_PROFILE_ID') || '';
    this.pollIntervalSeconds =
      this.configService.get('APPCONFIG_POLL_INTERVAL_SECONDS') || 45;

    if (
      !this.appConfigApplicationId ||
      !this.appConfigEnvironmentId ||
      !this.appConfigProfileId
    ) {
      this.logger.warn(
        'AWS AppConfig IDs are not configured. Feature flags will not work.',
      );
    } else {
      this.startSessionAndPoll();
    }
  }

  private async startSessionAndPoll(): Promise<void> {
    try {
      await this.startSession();
      await this.loadConfiguration(); // Initial load

      setInterval(async () => {
        await this.loadConfiguration();
      }, this.pollIntervalSeconds * 1000);
    } catch (error) {
      this.logger.error('Failed to initialize AppConfig session or polling', error);
    }
  }

  private async startSession(): Promise<void> {
    const command = new StartConfigurationSessionCommand({
      ApplicationIdentifier: this.appConfigApplicationId,
      ConfigurationProfileIdentifier: this.appConfigProfileId,
      EnvironmentIdentifier: this.appConfigEnvironmentId,
      RequiredMinimumPollIntervalInSeconds: this.pollIntervalSeconds - 5 > 0 ? this.pollIntervalSeconds -5 : 15, // Ensure it's at least 15
    });
    try {
      const response: StartConfigurationSessionCommandOutput =
        await this.appConfigClient.send(command);
      this.sessionToken = response.InitialConfigurationToken;
      this.logger.log('AWS AppConfig session started successfully.');
    } catch (error) {
      this.logger.error('Error starting AWS AppConfig session:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (!this.sessionToken) {
      this.logger.warn(
        'No AppConfig session token. Cannot load configuration.',
      );
      await this.startSession(); // Attempt to restart session
      if (!this.sessionToken) return;
    }

    try {
      const command = new GetLatestConfigurationCommand({
        ConfigurationToken: this.sessionToken,
      });
      const response = await this.appConfigClient.send(command);
      this.sessionToken = response.NextPollConfigurationToken; // Update for next poll
      this.lastPollTime = new Date();

      if (response.Configuration) {
        const configString = new TextDecoder().decode(response.Configuration);
        this.configuration = JSON.parse(
          configString,
        ) as AppConfigFlagsStructure;
        this.logger.log('AWS AppConfig configuration loaded/updated successfully.');
        // Update cache
        await this.cacheService.set(
          `${this.cacheKeyPrefix}all_flags`,
          this.configuration,
          this.pollIntervalSeconds * 2, // Cache for slightly longer than poll
        );
      } else {
        this.logger.log('No new AppConfig configuration received.');
      }
    } catch (error) {
      this.logger.error('Error loading AWS AppConfig configuration:', error);
      // Fallback to cached configuration if available
      if (!this.configuration) {
        const cachedConfig = await this.cacheService.get<AppConfigFlagsStructure>(
          `${this.cacheKeyPrefix}all_flags`,
        );
        if (cachedConfig) {
          this.configuration = cachedConfig;
          this.logger.warn('Using cached feature flag configuration due to load error.');
        }
      }
    }
  }

  private getFlagData(featureKey: string): AppConfigFlag | boolean | undefined {
    if (!this.configuration) {
        this.logger.warn(`Feature flag configuration not yet loaded. Cannot check key: ${featureKey}`);
        return undefined; // Or throw, or return default
    }
    return this.configuration[featureKey];
  }

  async isEnabled(featureKey: string, _context?: any): Promise<boolean> {
    // Context for targeting rules would require more complex AppConfig setup (e.g., extensions)
    // For now, we assume flags are global or use simple boolean structure.
    const flagData = this.getFlagData(featureKey);

    if (typeof flagData === 'boolean') {
      return flagData;
    }
    if (typeof flagData === 'object' && flagData !== null && 'enabled' in flagData) {
      return flagData.enabled;
    }
    // Default to false if flag is not found or malformed
    this.logger.debug(`Feature flag '${featureKey}' not found or malformed, defaulting to false.`);
    return false;
  }

  async getValue<T>(featureKey: string, defaultValue?: T, _context?: any): Promise<T> {
    const flagData = this.getFlagData(featureKey);

    if (typeof flagData === 'object' && flagData !== null && 'value' in flagData) {
      return flagData.value !== undefined ? flagData.value : (defaultValue as T);
    }
    if (typeof flagData === 'boolean' || typeof flagData === 'string' || typeof flagData === 'number') {
         // For simple flags where the flag itself is the value.
        return flagData as unknown as T;
    }
    this.logger.debug(`Value for feature flag '${featureKey}' not found, returning default value.`);
    return defaultValue as T;
  }
}