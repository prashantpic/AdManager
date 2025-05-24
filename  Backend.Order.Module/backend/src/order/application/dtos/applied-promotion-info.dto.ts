import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * Data Transfer Object for details of promotions applied to an order.
 * This is typically used in API responses.
 */
export class AppliedPromotionInfoDto {
  @IsNotEmpty()
  @IsString()
  promotionId: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount: number;
}