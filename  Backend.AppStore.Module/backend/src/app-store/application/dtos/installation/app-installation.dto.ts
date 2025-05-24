import { AppInstallationStatus } from '../../../common/enums/app-installation-status.enum';
import { InstallationConfigDto } from './install-app.dto';

export class AppInstallationDto {
  id: string;
  appId: string;
  appName?: string; // Denormalized for convenience
  merchantId: string;
  status: AppInstallationStatus;
  installationDate: Date;
  uninstallationDate?: Date;
  configuration?: InstallationConfigDto; // Or Record<string, any>
  createdAt: Date;
  updatedAt: Date;
}