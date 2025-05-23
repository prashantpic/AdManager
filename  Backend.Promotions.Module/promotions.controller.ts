import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionPreviewRequestDto } from './rules-engine/dtos/promotion-preview-request.dto';
import { PromotionPreviewResponseDto } from './rules-engine/dtos/promotion-preview-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // For API documentation

@ApiTags('Promotions')
@Controller('promotions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview applicable promotions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Promotion preview calculated successfully.', type: PromotionPreviewResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.'})
  async preview(@Body() previewRequestDto: PromotionPreviewRequestDto): Promise<PromotionPreviewResponseDto> {
    // This endpoint exposes the promotion preview functionality from the rules engine
    return this.promotionsService.previewPromotions(previewRequestDto);
  }
}