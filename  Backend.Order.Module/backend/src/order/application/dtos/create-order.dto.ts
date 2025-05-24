import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEmail, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GiftOptionsDto {
  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;
}

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional() // unitPrice is optional here, as it might be fetched from the product catalog by the backend
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GiftOptionsDto)
  giftOptions?: GiftOptionsDto;
}

export class CustomerDetailsDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  merchantId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNotEmpty({ message: 'Items array cannot be empty.' })
  @IsArray()
  @ValidateNested({ each: true, message: 'Each item in the items array must be a valid OrderItemDto.' })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty({ message: 'Customer details are required.' })
  @ValidateNested({ message: 'Customer details must be a valid CustomerDetailsDto.' })
  @Type(() => CustomerDetailsDto)
  customerDetails: CustomerDetailsDto;

  @IsNotEmpty({ message: 'Shipping address is required.' })
  @ValidateNested({ message: 'Shipping address must be a valid ShippingAddressDto.' })
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promotionCodes?: string[];

  @IsOptional()
  @ValidateNested({ message: 'Gift options must be a valid GiftOptionsDto.'})
  @Type(() => GiftOptionsDto)
  giftOptions?: GiftOptionsDto;
}