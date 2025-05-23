import { Injectable } from '@nestjs/common';
import { PromotionPreviewRequestDto } from './rules-engine/dtos/promotion-preview-request.dto';
import { PromotionPreviewResponseDto } from './rules-engine/dtos/promotion-preview-response.dto';
import { PromotionApplicationService } from './rules-engine/promotion-application.service';

@Injectable()
export class PromotionsService {
  constructor(
    // Inject the PromotionApplicationService from the rules-engine module
    private readonly promotionApplicationService: PromotionApplicationService,
  ) {}

  /**
   * Orchestrates the promotion preview process by delegating to the PromotionApplicationService.
   * REQ-PM-016: Implements a promotion hierarchy and rules engine for providing previews.
   * REQ-PM-014: The underlying PromotionApplicationService handles promotion hierarchy and rules.
   *
   * @param previewRequestDto The DTO containing the context for promotion evaluation.
   * @returns A promise that resolves to the promotion preview response.
   */
  async previewPromotions(previewRequestDto: PromotionPreviewRequestDto): Promise<PromotionPreviewResponseDto> {
    return this.promotionApplicationService.applyPromotions(previewRequestDto.context);
  }
}