import { CampaignObjective } from '../../constants/campaign-objective.enum';

export class CampaignCreatedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly merchantId: string,
    public readonly objective: CampaignObjective,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}