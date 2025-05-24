import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order.dto'; // Re-using OrderItemDto from CreateOrderDto for item structure

export class OneClickPurchaseRequestDto {
  @IsNotEmpty({ message: 'Items array cannot be empty for one-click purchase.' })
  @IsArray()
  @ValidateNested({ each: true, message: 'Each item in the items array must be a valid OrderItemDto.' })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  savedPaymentMethodId?: string;

  @IsOptional()
  @IsString()
  savedShippingAddressId?: string;
}