import { AdNetworkType } from '../../constants/ad-network-type.enum';

export class CampaignPublishedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly merchantId: string,
    public readonly adNetworkType: AdNetworkType,
    public readonly externalId: string,
    public readonly publishedAt: Date = new Date(),
  ) {}
}