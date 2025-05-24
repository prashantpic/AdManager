import { Injectable } from '@nestjs/common';
import { MerchantSubscriptionAggregate } from '../domain/aggregates/merchant-subscription.aggregate';
import { MerchantSubscriptionEntity } from '../entities/merchant-subscription.entity';
import { MerchantSubscriptionResponseDto, BillingInfoResponseDto, PaymentHistoryItemResponseDto } from '../dtos/merchant-subscription-response.dto';
import { SubscriptionPlanResponseDto } from '../dtos/subscription-plan-response.dto';
import { BillingDetailsVO } from '../domain/value-objects/billing-details.vo';
import { PaymentRecordVO } from '../domain/value-objects/payment-record.vo'; // Assume this VO exists
import { SubscriptionPlanAggregate } from '../domain/aggregates/subscription-plan.aggregate';
import { SubscriptionPlanMapper } from './subscription-plan.mapper';

@Injectable()
export class MerchantSubscriptionMapper {
  constructor(private readonly planMapper: SubscriptionPlanMapper) {}

  toDto(aggregate: MerchantSubscriptionAggregate, planAggregate: SubscriptionPlanAggregate): MerchantSubscriptionResponseDto {
    const planDto: SubscriptionPlanResponseDto = this.planMapper.toDto(planAggregate);

    let billingInfoResponse: BillingInfoResponseDto | null = null;
    if (aggregate.billingInfo) {
      // Example: Mask payment method token for response
      const tokenSnippet = aggregate.billingInfo.paymentMethodToken
        ? `**** **** **** ${aggregate.billingInfo.paymentMethodToken.slice(-4)}`
        : 'N/A';
      billingInfoResponse = {
        paymentMethodTokenSnippet: tokenSnippet,
        address: aggregate.billingInfo.address,
        contactEmail: aggregate.billingInfo.contactEmail,
      };
    }

    const paymentHistoryResponse: PaymentHistoryItemResponseDto[] = aggregate.paymentHistory.map(p => ({
      amount: p.amount,
      currency: p.currency,
      date: p.date,
      type: p.type,
      status: p.status,
      gatewayTransactionId: p.gatewayTransactionId,
      reason: p.reason,
    }));

    return {
      id: aggregate.id,
      merchantId: aggregate.merchantId,
      plan: planDto,
      status: aggregate.status,
      billingCycle: aggregate.billingCycle,
      startDate: aggregate.startDate,
      endDate: aggregate.endDate,
      currentPeriodStart: aggregate.currentPeriodStart,
      currentPeriodEnd: aggregate.currentPeriodEnd,
      billingInfo: billingInfoResponse,
      paymentHistory: paymentHistoryResponse,
    };
  }

  toEntity(aggregate: MerchantSubscriptionAggregate): MerchantSubscriptionEntity {
    const entity = new MerchantSubscriptionEntity();
    entity.id = aggregate.id;
    entity.merchantId = aggregate.merchantId;
    entity.planId = aggregate.planId;
    entity.status = aggregate.status;
    entity.billingCycle = aggregate.billingCycle;
    entity.startDate = aggregate.startDate;
    entity.endDate = aggregate.endDate;
    entity.currentPeriodStart = aggregate.currentPeriodStart;
    entity.currentPeriodEnd = aggregate.currentPeriodEnd;
    entity.billingInfoJson = aggregate.billingInfo ? JSON.stringify(aggregate.billingInfo) : null;
    entity.paymentHistoryJson = JSON.stringify(aggregate.paymentHistory);
    entity.dunningAttempts = aggregate.dunningAttempts;
    entity.lastPaymentAttempt = aggregate.lastPaymentAttempt;
    // createdAt and updatedAt are handled by TypeORM
    return entity;
  }

  toAggregate(entity: MerchantSubscriptionEntity): MerchantSubscriptionAggregate {
    const billingInfo = entity.billingInfoJson
      ? new BillingDetailsVO(
          JSON.parse(entity.billingInfoJson).paymentMethodToken,
          JSON.parse(entity.billingInfoJson).address,
          JSON.parse(entity.billingInfoJson).contactEmail,
        )
      : null;

    const paymentHistory: PaymentRecordVO[] = JSON.parse(entity.paymentHistoryJson).map(
      (p: any) => new PaymentRecordVO(p.amount, p.currency, new Date(p.date), p.type, p.status, p.gatewayTransactionId, p.reason),
    );

    return MerchantSubscriptionAggregate.rehydrate(
      entity.id,
      entity.merchantId,
      entity.planId,
      entity.status,
      entity.billingCycle,
      entity.startDate,
      entity.endDate,
      entity.currentPeriodStart,
      entity.currentPeriodEnd,
      billingInfo,
      paymentHistory,
      entity.dunningAttempts,
      entity.lastPaymentAttempt,
      // entity.createdAt, // Not typically part of domain aggregate state unless business logic depends on it
      // entity.updatedAt,
    );
  }
}