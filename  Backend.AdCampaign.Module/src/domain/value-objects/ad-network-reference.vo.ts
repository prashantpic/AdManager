import { AdNetworkType } from '../../constants/ad-network-type.enum';
import { ArgumentInvalidException } from '../exceptions/argument-invalid.exception';

export class AdNetworkReference {
  public readonly adNetworkType: AdNetworkType;
  public readonly externalId: string;

  constructor(adNetworkType: AdNetworkType, externalId: string) {
    if (!adNetworkType || !Object.values(AdNetworkType).includes(adNetworkType)) {
      throw new ArgumentInvalidException('Invalid ad network type provided for reference.');
    }
    if (!externalId || externalId.trim().length === 0) {
      throw new ArgumentInvalidException('External ID for ad network reference cannot be empty.');
    }

    this.adNetworkType = adNetworkType;
    this.externalId = externalId;
  }

  // Getter methods can be added
}