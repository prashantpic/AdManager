import { Injectable } from '@nestjs/common';
import { OrderAggregate } from '../aggregates/order/order.aggregate';
import { AppliedPromotionData } from '../aggregates/order/applied-promotion.value-object';

export interface CalculatedTotals {
    subtotal: number;
    totalDiscount: number;
    shippingCost: number;
    // taxes: number; // If taxes are calculated
    totalAmount: number; // Final amount to be paid
}

/**
 * Domain service for performing complex calculations on orders.
 * Encapsulates complex order calculation logic that doesn't fit naturally within the OrderAggregate.
 */
@Injectable()
export class OrderCalculationService {
  /**
   * Calculates various monetary aspects of an order.
   * @param order The OrderAggregate instance to calculate totals for.
   * @param taxRates Optional tax rates or tax calculation context.
   * @param promotionEffects Optional pre-validated promotion effects. (The aggregate itself holds applied promotions)
   * @returns An object containing the calculated totals.
   */
  calculateOrderTotals(
    order: OrderAggregate,
    taxRates?: any, // Define structure if used
    // promotionEffects are already part of the OrderAggregate as AppliedPromotion[]
  ): CalculatedTotals {
    // 1. Calculate subtotal from line items
    const subtotal = order.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // 2. Calculate total discount from applied promotions on the aggregate
    const totalDiscount = order.appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0);

    // 3. Get shipping cost from the aggregate
    const shippingCost = order.shippingInformation.cost;

    // 4. Calculate taxes (Placeholder - implement if needed)
    // For example, apply taxRate to (subtotal - itemSpecificDiscounts + shippingCost - shippingDiscounts)
    // This would require more detailed promotionEffects if discounts apply differently.
    const taxes = 0; // Example: const taxes = this.calculateTaxes(subtotal - totalDiscount, shippingCost, taxRates);

    // 5. Calculate final total amount
    const totalAmount = subtotal - totalDiscount + shippingCost + taxes;

    const calculatedTotals: CalculatedTotals = {
        subtotal,
        totalDiscount,
        shippingCost,
        // taxes,
        totalAmount: Math.max(0, totalAmount), // Ensure total is not negative
    };

    // The service returns the calculated values.
    // The Application Service or OrderAggregate itself would then update the OrderAggregate's state.
    // For instance, order.updateTotals(calculatedTotals);
    return calculatedTotals;
  }

  // private calculateTaxes(taxableAmount: number, shippingCost: number, taxRates: any): number {
  //   // Complex tax logic would go here, potentially involving a tax provider adapter
  //   if (taxRates && taxRates.rate) {
  //     return (taxableAmount + shippingCost) * taxRates.rate;
  //   }
  //   return 0;
  // }
}