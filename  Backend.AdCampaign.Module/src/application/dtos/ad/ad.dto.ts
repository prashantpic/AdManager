import { CreativeDto } from '../creative/creative.dto';
import { AdCreativeContentDto } from '../value-objects/ad-creative-content.dto';
import { AdNetworkReferenceDto } from '../value-objects/ad-network-reference.dto';
import { CreativeType } from '../../../constants/creative-type.enum';

export class AdDto {
  id: string;
  name: string;
  adSetId: string;
  creative?: CreativeDto | null; // Could be just creativeId
  creativeId?: string | null;
  creativeType?: CreativeType | null;
  creativeContent?: AdCreativeContentDto | null;
  productIds?: string[] | null;
  promotionIds?: string[] | null;
  landingPageUrl?: string | null;
  adNetworkReferences?: AdNetworkReferenceDto[];
  createdAt: Date;
  updatedAt: Date;
}