import { Injectable } from '@nestjs/common';
import { Audience } from '../../domain/entities/audience.entity';
import { DefineAudienceDto } from '../dtos/audience/define-audience.dto';
import { AudienceDto } from '../dtos/audience/audience.dto';
import { TargetingParameters } from '../../domain/value-objects/targeting-parameters.vo';
import { TargetingParametersDto } from '../dtos/audience/targeting-parameters.dto';

@Injectable()
export class AudienceMapper {
  toDto(entity: Audience): AudienceDto {
    const dto = new AudienceDto();
    dto.id = entity.id;
    dto.merchantId = entity.merchantId;
    dto.name = entity.name;
    dto.description = entity.description;
    // Assuming TargetingParametersDto matches TargetingParameters structure
    dto.targetingParameters = entity.targetingParameters?.getParameters() as TargetingParametersDto || {};
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  extractCreationData(dto: DefineAudienceDto, merchantId: string): {
    name: string;
    description?: string | null;
    targetingParameters: TargetingParameters;
    merchantId: string;
  } {
    return {
      merchantId,
      name: dto.name,
      description: dto.description,
      targetingParameters: new TargetingParameters(dto.targetingParameters || {}),
    };
  }

  applyUpdateDto(entity: Audience, dto: DefineAudienceDto): Audience {
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    if (dto.description !== undefined) {
      entity.description = dto.description;
    }
    if (dto.targetingParameters !== undefined) {
      entity.targetingParameters = new TargetingParameters(dto.targetingParameters || {});
    }
    return entity;
  }
}