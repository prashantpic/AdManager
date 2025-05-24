import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GiftOptionsDto } from './gift-options.dto';

/**
 * Data Transfer Object for order line items.
 * Used for both creating new order items and representing them in responses.
 */
export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional() // Optional in request DTO if backend fetches it, but might be required in response.
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  // totalPrice would typically be in a response DTO, calculated by the backend.
  // If this DTO is used for response, totalPrice should be added and populated by the mapper.
  // For now, adhering strictly to the provided properties in the file definition.

  @IsOptional()
  @ValidateNested()
  @Type(() => GiftOptionsDto)
  giftOptions?: GiftOptionsDto;
}