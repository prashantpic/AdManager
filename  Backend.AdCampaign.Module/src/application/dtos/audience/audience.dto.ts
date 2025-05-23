import { TargetingParametersDto } from '../value-objects/targeting-parameters.dto';

export class AudienceDto {
  id: string;
  merchantId: string;
  name: string;
  description?: string | null;
  targetingParameters: TargetingParametersDto; // Or could be the raw JSON object
  createdAt: Date;
  updatedAt: Date;
}