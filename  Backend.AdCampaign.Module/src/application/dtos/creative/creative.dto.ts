import { CreativeType } from '../../../constants/creative-type.enum';
import { AssetLocationDto } from '../value-objects/asset-location.dto';
import { AdCreativeContentDto } from '../value-objects/ad-creative-content.dto';

export class CreativeDto {
  id: string;
  merchantId: string;
  name: string;
  type: CreativeType;
  assetLocation: AssetLocationDto;
  content?: AdCreativeContentDto | null;
  createdAt: Date;
  updatedAt: Date;
}