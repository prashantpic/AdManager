import { IsUUID, IsNotEmpty } from 'class-validator';

export class UninstallAppDto {
  // Client can provide either installationId or appId if only one app can be installed
  // For more robustness, installationId is preferred if known
  @IsUUID()
  @IsNotEmpty()
  installationId: string; // The ID of the AppInstallationEntity record
}