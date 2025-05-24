import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { OrderItemDto as RequestOrderItemDto, CustomerDetailsDto, ShippingAddressDto, GiftOptionsDto } from './create-order.dto';
import { AppliedPromotionInfoDto } from './applied-promotion-info.dto';
import { OrderStatus } from '../../domain/enums/order-status.enum';

// OrderItemDto for response might differ slightly (e.g., unitPrice mandatory)
export class ResponseOrderItemDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  productId: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalPrice: number; // quantity * unitPrice

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => GiftOptionsDto)
  giftOptions?: GiftOptionsDto;
}

// DTO for shipping information within the OrderDto response
export class ResponseShippingInformationDto {
  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  address: ShippingAddressDto;

  @Expose()
  @IsNotEmpty()
  @IsString()
  method: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  cost: number;
}


export class OrderDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  id: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  merchantId: string;

  @Expose()
  @IsOptional()
  @IsString()
  customerId?: string;

  @Expose()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseOrderItemDto)
  items: ResponseOrderItemDto[];

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails: CustomerDetailsDto;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ResponseShippingInformationDto)
  shippingInformation: ResponseShippingInformationDto;

  @Expose()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppliedPromotionInfoDto)
  appliedPromotions?: AppliedPromotionInfoDto[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => GiftOptionsDto)
  giftOptions?: GiftOptionsDto;

  @Expose()
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @Expose()
  @IsNotEmpty()
  @IsString()
  currency: string;

  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}