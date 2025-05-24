import { Injectable } from '@nestjs/common';
import { OrderAggregate } from '../../../../domain/aggregates/order/order.aggregate';
import { OrderTypeOrmEntity } from '../entities/order.typeorm-entity';
import { LineItem } from '../../../../domain/aggregates/order/line-item.entity';
import { CustomerInformation } from '../../../../domain/aggregates/order/customer-information.value-object';
import { ShippingInformation, ShippingAddressValueObject } from '../../../../domain/aggregates/order/shipping-information.value-object';
import { GiftOption } from '../../../../domain/aggregates/order/gift-option.value-object';
import { AppliedPromotion } from '../../../../domain/aggregates/order/applied-promotion.value-object';
import { LineItemTypeOrmEntity } from '../entities/line-item.typeorm-entity';
import { CustomerInformationTypeOrmEmbeddable } from '../embeddables/customer-information.typeorm-embeddable';
import { ShippingInformationTypeOrmEmbeddable } from '../embeddables/shipping-information.typeorm-embeddable';
import { ShippingAddressTypeOrmEmbeddable } from '../embeddables/shipping-address.typeorm-embeddable';
import { GiftOptionTypeOrmEmbeddable } from '../embeddables/gift-option.typeorm-embeddable';
import { AppliedPromotionTypeOrmEmbeddable } from '../embeddables/applied-promotion.typeorm-embeddable';

@Injectable()
export class TypeOrmOrderMapper {

  /**
   * Maps an OrderAggregate domain object to a TypeORM OrderTypeOrmEntity.
   * @param aggregate The OrderAggregate to map.
   * @returns The mapped OrderTypeOrmEntity.
   */
  toOrmEntity(aggregate: OrderAggregate): OrderTypeOrmEntity {
    const entity = new OrderTypeOrmEntity();
    entity.id = aggregate.id;
    entity.merchantId = aggregate.merchantId;
    entity.customerId = aggregate.customerId;
    entity.status = aggregate.status;
    entity.totalAmount = aggregate.totalAmount;
    entity.currency = aggregate.currency;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;

    entity.customerInformation = this.mapCustomerInformationToOrmEmbeddable(aggregate.customerInformation);
    entity.shippingInformation = this.mapShippingInformationToOrmEmbeddable(aggregate.shippingInformation);
    entity.giftOption = aggregate.giftOption ? this.mapGiftOptionToOrmEmbeddable(aggregate.giftOption) : undefined;
    entity.lineItems = aggregate.lineItems.map(item => this.mapLineItemToOrmEntity(item, entity));
    entity.appliedPromotions = aggregate.appliedPromotions?.map(promo => this.mapAppliedPromotionToOrmEmbeddable(promo));

    return entity;
  }

  /**
   * Maps a TypeORM OrderTypeOrmEntity back to an OrderAggregate domain object.
   * @param entity The OrderTypeOrmEntity to map.
   * @returns The mapped OrderAggregate.
   */
  toDomain(entity: OrderTypeOrmEntity): OrderAggregate {
     const aggregateData = {
        id: entity.id,
        merchantId: entity.merchantId,
        customerId: entity.customerId,
        lineItems: entity.lineItems ? entity.lineItems.map(itemEntity => this.mapLineItemToDomain(itemEntity)) : [],
        customerInformation: this.mapCustomerInformationToDomain(entity.customerInformation),
        shippingInformation: this.mapShippingInformationToDomain(entity.shippingInformation),
        appliedPromotions: entity.appliedPromotions ? entity.appliedPromotions.map(promoEmbeddable => this.mapAppliedPromotionToDomain(promoEmbeddable)) : [],
        giftOption: entity.giftOption ? this.mapGiftOptionToDomain(entity.giftOption) : undefined,
        status: entity.status,
        totalAmount: parseFloat(entity.totalAmount as any),
        currency: entity.currency,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
     };
     return OrderAggregate.rehydrate(aggregateData);
  }

  private mapLineItemToOrmEntity(item: LineItem, orderEntity: OrderTypeOrmEntity): LineItemTypeOrmEntity {
      const itemEntity = new LineItemTypeOrmEntity();
      itemEntity.id = item.id;
      itemEntity.productId = item.productId;
      itemEntity.productName = item.productName;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice;
      itemEntity.totalPrice = item.totalPrice;
      itemEntity.giftOption = item.giftOption ? this.mapGiftOptionToOrmEmbeddable(item.giftOption) : undefined;
      itemEntity.order = orderEntity;
      return itemEntity;
  }

   private mapCustomerInformationToOrmEmbeddable(customerInfo: CustomerInformation): CustomerInformationTypeOrmEmbeddable {
      const embeddable = new CustomerInformationTypeOrmEmbeddable();
      embeddable.email = customerInfo.email;
      embeddable.firstName = customerInfo.firstName;
      embeddable.lastName = customerInfo.lastName;
      embeddable.phone = customerInfo.phone;
      return embeddable;
   }

    private mapShippingInformationToOrmEmbeddable(shippingInfo: ShippingInformation): ShippingInformationTypeOrmEmbeddable {
       const embeddable = new ShippingInformationTypeOrmEmbeddable();
       embeddable.address = this.mapShippingAddressVoToOrmEmbeddable(shippingInfo.address);
       embeddable.method = shippingInfo.method;
       embeddable.cost = shippingInfo.cost;
       return embeddable;
   }

    private mapShippingAddressVoToOrmEmbeddable(addressVo: ShippingAddressValueObject): ShippingAddressTypeOrmEmbeddable {
        const embeddable = new ShippingAddressTypeOrmEmbeddable();
        embeddable.street = addressVo.street;
        embeddable.city = addressVo.city;
        embeddable.state = addressVo.state;
        embeddable.postalCode = addressVo.postalCode;
        embeddable.country = addressVo.country;
        return embeddable;
    }

  private mapGiftOptionToOrmEmbeddable(giftOption: GiftOption): GiftOptionTypeOrmEmbeddable {
      const embeddable = new GiftOptionTypeOrmEmbeddable();
      embeddable.isGift = giftOption.isGift;
      embeddable.message = giftOption.message;
      embeddable.recipientName = giftOption.recipientName;
      return embeddable;
  }

   private mapAppliedPromotionToOrmEmbeddable(promo: AppliedPromotion): AppliedPromotionTypeOrmEmbeddable {
      const embeddable = new AppliedPromotionTypeOrmEmbeddable();
      embeddable.promotionId = promo.promotionId;
      embeddable.code = promo.code;
      embeddable.description = promo.description;
      embeddable.discountAmount = promo.discountAmount;
      return embeddable;
   }

  private mapLineItemToDomain(itemEntity: LineItemTypeOrmEntity): LineItem {
      const lineItemData = {
          productId: itemEntity.productId,
          productName: itemEntity.productName,
          quantity: itemEntity.quantity,
          unitPrice: parseFloat(itemEntity.unitPrice as any),
          giftOption: itemEntity.giftOption ? this.mapGiftOptionToDomain(itemEntity.giftOption) : undefined,
      };
      // The ID from persistence can be used to rehydrate the entity
      const lineItem = new LineItem(lineItemData);
      (lineItem as any)._id = itemEntity.id; // Assign persistent ID back to domain entity
      return lineItem;
  }

    private mapCustomerInformationToDomain(embeddable: CustomerInformationTypeOrmEmbeddable): CustomerInformation {
        return new CustomerInformation({
            email: embeddable.email,
            firstName: embeddable.firstName,
            lastName: embeddable.lastName,
            phone: embeddable.phone,
        });
    }

    private mapShippingInformationToDomain(embeddable: ShippingInformationTypeOrmEmbeddable): ShippingInformation {
        return new ShippingInformation(
             this.mapShippingAddressEmbeddableToDomainVoData(embeddable.address),
             embeddable.method,
             parseFloat(embeddable.cost as any),
        );
    }

    private mapShippingAddressEmbeddableToDomainVoData(embeddable: ShippingAddressTypeOrmEmbeddable): any {
       return { // This returns data for ShippingAddressValueObject constructor
           street: embeddable.street,
           city: embeddable.city,
           state: embeddable.state,
           postalCode: embeddable.postalCode,
           country: embeddable.country,
       };
    }

    private mapGiftOptionToDomain(embeddable: GiftOptionTypeOrmEmbeddable): GiftOption {
       return new GiftOption({
           isGift: embeddable.isGift,
           message: embeddable.message,
           recipientName: embeddable.recipientName,
       });
   }

   private mapAppliedPromotionToDomain(embeddable: AppliedPromotionTypeOrmEmbeddable): AppliedPromotion {
        return new AppliedPromotion({
           promotionId: embeddable.promotionId,
           code: embeddable.code,
           description: embeddable.description,
           discountAmount: parseFloat(embeddable.discountAmount as any),
        });
   }
}