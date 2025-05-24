import { Injectable, HttpService } from '@nestjs/common'; // HttpService from @nestjs/axios
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface PlatformApiVersionResponse {
  latestStableVersion: string;
  supportedVersions: string[];
  // Potentially more details like EOL dates for older versions
}

@Injectable()
export class PlatformApiVersionClient {
  private coreApiServiceUrl: string; // Assuming a core service provides this

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // This URL would point to an endpoint in a Core module or a dedicated API versioning service
    this.coreApiServiceUrl = this.configService.get<string>('services.coreApi.url'); 
  }

  async getLatestPlatformVersion(): Promise<string> {
    // REQ-8-006 (Implicit dependency)
    try {
      const response = await firstValueFrom(
        this.httpService.get<PlatformApiVersionResponse>(`${this.coreApiServiceUrl}/platform/api-versions`)
      );
      return response.data.latestStableVersion;
    } catch (error) {
      // console.error('Error fetching latest platform API version:', error.response?.data || error.message);
      throw new Error(`PlatformApiVersionClient: Failed to get latest platform API version - ${error.response?.data?.message || error.message}`);
    }
  }

  async getSupportedPlatformVersions(): Promise<string[]> {
    // REQ-8-006 (Implicit dependency)
    try {
      const response = await firstValueFrom(
        this.httpService.get<PlatformApiVersionResponse>(`${this.coreApiServiceUrl}/platform/api-versions`)
      );
      return response.data.supportedVersions;
    } catch (error) {
      // console.error('Error fetching supported platform API versions:', error.response?.data || error.message);
      throw new Error(`PlatformApiVersionClient: Failed to get supported platform API versions - ${error.response?.data?.message || error.message}`);
    }
  }
}