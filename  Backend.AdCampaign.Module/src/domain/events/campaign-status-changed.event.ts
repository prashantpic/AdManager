import { CampaignStatus } from '../../constants/campaign-status.enum';

export class CampaignStatusChangedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly merchantId: string,
    public readonly oldStatus: CampaignStatus,
    public readonly newStatus: CampaignStatus,
    public readonly timestamp: Date = new Date(),
    public readonly adNetworkType?: AdNetworkType, // Optional: if status change is specific to a network
    public readonly externalId?: string, // Optional: external ID if relevant
  ) {}
}