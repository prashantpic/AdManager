import { Injectable } from '@nestjs/common';
import { OrderAggregate, CreateOrderData as DomainCreateOrderData } from '../../domain/aggregates/order/order.aggregate';
import { OrderDto, ResponseOrderItemDto, ResponseShippingInformationDto } from '../dtos/order.dto';
import { CreateOrderDto, CustomerDetailsDto, ShippingAddressDto, GiftOptionsDto, OrderItemDto as RequestOrderItemDto } from '../dtos/create-order.dto';
import { AppliedPromotionInfoDto } from '../dtos/applied-promotion-info.dto';
import { LineItem } from '../../domain/aggregates/order/line-item.entity';
import { CustomerInformation } from '../../domain/aggregates/order/customer-information.value-object';
import { ShippingInformation, ShippingAddressValueObject } from '../../domain/aggregates/order/shipping-information.value-object';
import { GiftOption } from '../../domain/aggregates/order/gift-option.value-object';
import { AppliedPromotion } from '../../domain/aggregates/order/applied-promotion.value-object';

@Injectable()
export class OrderMapper {
  /**
   * Maps an OrderAggregate domain object to an OrderDto.
   * @param order The OrderAggregate instance.
   * @returns The corresponding OrderDto.
   */
  toDto(order: OrderAggregate): OrderDto {
    const orderDto = new OrderDto();
    orderDto.id = order.id;
    orderDto.merchantId = order.merchantId;
    orderDto.customerId = order.customerId;
    orderDto.status = order.status;
    orderDto.totalAmount = order.totalAmount;
    orderDto.currency = order.currency;
    orderDto.createdAt = order.createdAt;
    orderDto.updatedAt = order.updatedAt;

    orderDto.customerDetails = this.customerInformationToDto(order.customerInformation);
    orderDto.shippingInformation = this.shippingInformationToDto(order.shippingInformation);
    orderDto.giftOptions = order.giftOption ? this.giftOptionToDto(order.giftOption) : undefined;
    orderDto.items = order.lineItems.map(item => this.lineItemToDto(item));
    orderDto.appliedPromotions = order.appliedPromotions?.map(promo => this.appliedPromotionToDto(promo));

    return orderDto;
  }

  /**
   * Maps a CreateOrderDto to a partial domain structure suitable for OrderAggregate.create().
   * This method is simplified; full mapping of items usually requires fetching product details
   * within an application service.
   * @param dto The CreateOrderDto instance.
   * @returns Partial data for creating an OrderAggregate.
   */
  toDomainCreateData(dto: CreateOrderDto): Partial<DomainCreateOrderData> {
    // Note: Item mapping here is simplified. Application service will handle fetching product details.
    // This mapping is more for customer, shipping, and gift options structure.
    return {
      merchantId: dto.merchantId,
      customerId: dto.customerId,
      // items: dto.items.map(itemDto => this.requestOrderItemDtoToDomainData(itemDto)), // App service handles this
      customerDetails: this.customerDetailsDtoToDomain(dto.customerDetails),
      shippingAddress: this.shippingAddressDtoToDomain(dto.shippingAddress), // Used to construct ShippingInformation in domain
      promotionCodes: dto.promotionCodes,
      giftOptions: dto.giftOptions ? this.giftOptionsDtoToDomain(dto.giftOptions) : undefined,
      // status and currency will be set by the domain or application service
    };
  }

  private lineItemToDto(item: LineItem): ResponseOrderItemDto {
    const itemDto = new ResponseOrderItemDto();
    itemDto.productId = item.productId;
    itemDto.quantity = item.quantity;
    itemDto.unitPrice = item.unitPrice;
    itemDto.totalPrice = item.totalPrice;
    itemDto.giftOptions = item.giftOption ? this.giftOptionToDto(item.giftOption) : undefined;
    return itemDto;
  }

  private customerInformationToDto(info: CustomerInformation): CustomerDetailsDto {
    const dto = new CustomerDetailsDto();
    dto.email = info.email;
    dto.firstName = info.firstName;
    dto.lastName = info.lastName;
    dto.phone = info.phone;
    return dto;
  }

  private shippingInformationToDto(info: ShippingInformation): ResponseShippingInformationDto {
    const dto = new ResponseShippingInformationDto();
    dto.address = this.shippingAddressVoToDto(info.address);
    dto.method = info.method;
    dto.cost = info.cost;
    return dto;
  }

  private shippingAddressVoToDto(address: ShippingAddressValueObject): ShippingAddressDto {
    const dto = new ShippingAddressDto();
    dto.street = address.street;
    dto.city = address.city;
    dto.state = address.state;
    dto.postalCode = address.postalCode;
    dto.country = address.country;
    return dto;
  }

  private giftOptionToDto(option: GiftOption): GiftOptionsDto {
    const dto = new GiftOptionsDto();
    dto.isGift = option.isGift;
    dto.message = option.message;
    dto.recipientName = option.recipientName;
    return dto;
  }

  private appliedPromotionToDto(promo: AppliedPromotion): AppliedPromotionInfoDto {
    const dto = new AppliedPromotionInfoDto();
    dto.promotionId = promo.promotionId;
    dto.code = promo.code;
    dto.description = promo.description;
    dto.discountAmount = promo.discountAmount;
    return dto;
  }

  // Mappers from DTO to Domain Data (for creation data passed to aggregate factory)
  private customerDetailsDtoToDomain(dto: CustomerDetailsDto): CustomerInformation['props'] {
    return {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    };
  }

  private shippingAddressDtoToDomain(dto: ShippingAddressDto): ShippingAddressValueObject['props'] {
    return {
      street: dto.street,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
    };
  }

  private giftOptionsDtoToDomain(dto: GiftOptionsDto): GiftOption['props'] {
    return {
      isGift: dto.isGift,
      message: dto.message,
      recipientName: dto.recipientName,
    };
  }

  // This would be used by application service if it constructs LineItemData directly from DTOs
  // before calling aggregate factory.
  // private requestOrderItemDtoToDomainData(dto: RequestOrderItemDto): any { // LineItemData
  //   return {
  //     productId: dto.productId,
  //     quantity: dto.quantity,
  //     unitPrice: dto.unitPrice, // Assuming this is set by application service after fetching
  //     giftOption: dto.giftOptions ? this.giftOptionsDtoToDomain(dto.giftOptions) : undefined,
  //   };
  // }
}