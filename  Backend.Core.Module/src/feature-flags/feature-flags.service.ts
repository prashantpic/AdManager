import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommandInput,
  GetLatestConfigurationCommandInput,
} from '@aws-sdk/client-appconfigdata';
import { CoreConfigService } from '../config/config.service';
import { IFeatureFlagsService } from './feature-flags.interface';
import { APPCONFIG_DATA_CLIENT } from './feature-flags.module';
import { ICacheService } from '../cache/cache.interface'; // Optional

interface AppConfigFlagStructure {
  [key: string]: {
    enabled: boolean;
    // other properties like value, variants etc.
  };
}

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private sessionToken: string | undefined;
  private pollInterval: NodeJS.Timeout | undefined;
  private configuration: AppConfigFlagStructure = {}; // In-memory cache of the flags
  private readonly appConfigPollIntervalSeconds = 30; // Example, make configurable

  constructor(
    @Inject(APPCONFIG_DATA_CLIENT)
    private readonly appConfigClient: AppConfigDataClient,
    private readonly configService: CoreConfigService,
    @Inject(ICacheService) private readonly cacheService?: ICacheService, // Optional cache
  ) {
    this.initializeSessionAndPolling();
  }

  private async initializeSessionAndPolling(): Promise<void> {
    try {
      await this.startSession();
      await this.loadConfiguration(); // Initial load

      // Clear existing interval if any
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      
      // Setup polling
      const pollIntervalMs = (this.configService.get('APPCONFIG_POLL_INTERVAL_SECONDS') || this.appConfigPollIntervalSeconds) * 1000;
      this.pollInterval = setInterval(async () => {
        await this.loadConfiguration();
      }, pollIntervalMs);

    } catch (error) {
      this.logger.error('Failed to initialize AppConfig session or polling', error.stack);
    }
  }

  private async startSession(): Promise<void> {
    const params: StartConfigurationSessionCommandInput = {
      ApplicationIdentifier: this.configService.get('APPCONFIG_APPLICATION_ID'),
      ConfigurationProfileIdentifier: this.configService.get('APPCONFIG_PROFILE_ID'),
      EnvironmentIdentifier: this.configService.get('APPCONFIG_ENVIRONMENT_ID'),
      RequiredMinimumPollIntervalInSeconds: this.configService.get('APPCONFIG_MIN_POLL_INTERVAL_SECONDS') || 15,
    };

    try {
      const command = new StartConfigurationSessionCommand(params);
      const response = await this.appConfigClient.send(command);
      this.sessionToken = response.InitialConfigurationToken;
      this.logger.log('AppConfig session started successfully.');
    } catch (error) {
      this.logger.error('Error starting AppConfig session:', error.stack);
      throw error; // Re-throw to indicate initialization failure
    }
  }

  private async loadConfiguration(): Promise<void> {
    if (!this.sessionToken) {
      this.logger.warn('No AppConfig session token available. Skipping configuration load.');
      // Attempt to re-initialize session if token is missing
      try {
        await this.startSession();
        if(!this.sessionToken) return; // if still no token after retry
      } catch (error) {
        this.logger.error('Failed to re-initialize AppConfig session during loadConfiguration.', error.stack);
        return;
      }
    }

    const params: GetLatestConfigurationCommandInput = {
      ConfigurationToken: this.sessionToken,
    };

    try {
      const command = new GetLatestConfigurationCommand(params);
      const response = await this.appConfigClient.send(command);
      
      this.sessionToken = response.NextPollConfigurationToken; // Update token for next poll

      if (response.Configuration) {
        const configString = new TextDecoder().decode(response.Configuration);
        const parsedConfig = JSON.parse(configString);
        
        // Assuming the configuration is a flat object of flags
        // e.g., { "myFeature": { "enabled": true }, "anotherFeature": { "enabled": false } }
        if (this.isValidFlagStructure(parsedConfig)) {
            this.configuration = parsedConfig;
            this.logger.log('AppConfig configuration loaded/updated successfully.');

            // Optionally, update a shared cache if using one
            if (this.cacheService) {
              await this.cacheService.set('appconfig_flags', this.configuration, this.appConfigPollIntervalSeconds * 2);
            }
        } else {
            this.logger.warn('Loaded AppConfig data does not match expected flag structure.');
        }

      } else {
        this.logger.log('No new AppConfig configuration data received.');
      }
    } catch (error)
    {
      // Handle common errors like ThrottlingException, BadRequestException (e.g. token expired)
      if (error.name === 'BadRequestException' && this.sessionToken) {
        this.logger.warn('AppConfig session token likely expired. Attempting to restart session.');
        await this.startSession(); // Re-initialize session on token expiry
      } else {
        this.logger.error('Error loading AppConfig configuration:', error.stack);
      }
    }
  }

  private isValidFlagStructure(config: any): config is AppConfigFlagStructure {
    if (typeof config !== 'object' || config === null) return false;
    // Basic check: iterate over keys and see if they have an 'enabled' boolean property
    // For a more robust check, use a schema validator (e.g., Joi, Zod)
    return Object.values(config).every(
        (flag: any) => typeof flag === 'object' && typeof flag.enabled === 'boolean'
    );
  }


  async isEnabled(featureKey: string, _context?: any): Promise<boolean> {
    // Context could be used if AppConfig profile supports context-based evaluation,
    // but this basic client fetches the whole config.
    // For more advanced targeting, AWS AppConfig Extensions or a different SDK interaction might be needed.
    const flag = this.configuration[featureKey];
    return flag ? flag.enabled : false; // Default to false if flag not found
  }

  async getValue<T>(featureKey: string, defaultValue?: T, _context?: any): Promise<T> {
    const flagConfig = this.configuration[featureKey];
    if (flagConfig && typeof flagConfig === 'object' && 'value' in flagConfig) {
      return (flagConfig as any).value as T;
    }
    // Check for boolean enabled status as a simple value if 'value' property doesn't exist
    if (flagConfig && typeof flagConfig.enabled === 'boolean' && defaultValue === undefined) {
        return flagConfig.enabled as unknown as T;
    }
    return defaultValue as T;
  }

  // Call this on module destroy to clean up interval
  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}