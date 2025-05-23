import { Injectable, Logger } from '@nestjs/common';

/**
 * A utility service for calculating standard analytics metrics
 * such as ROAS, CPA, CPC, CTR, and AOV.
 */
@Injectable()
export class MetricCalculatorService {
  private readonly logger = new Logger(MetricCalculatorService.name);

  /**
   * Calculates Return On Ad Spend.
   * @param totalRevenue Total revenue generated.
   * @param totalSpend Total amount spent on ads.
   * @returns ROAS value, or null if spend is zero or negative.
   */
  calculateROAS(totalRevenue: number, totalSpend: number): number | null {
    if (totalSpend <= 0) {
      // this.logger.warn('Cannot calculate ROAS: totalSpend is zero or negative.');
      return totalRevenue > 0 ? Infinity : 0; // Or null, depending on how you want to represent this
    }
    return totalRevenue / totalSpend;
  }

  /**
   * Calculates Cost Per Acquisition.
   * @param totalCost Total cost incurred.
   * @param totalAcquisitions Total number of acquisitions.
   * @returns CPA value, or null if acquisitions are zero.
   */
  calculateCPA(totalCost: number, totalAcquisitions: number): number | null {
    if (totalAcquisitions === 0) {
      // this.logger.warn('Cannot calculate CPA: totalAcquisitions is zero.');
      return null; // Or Infinity if cost > 0, or 0 if cost is 0
    }
    return totalCost / totalAcquisitions;
  }

  /**
   * Calculates Cost Per Click.
   * @param totalCost Total cost incurred.
   * @param totalClicks Total number of clicks.
   * @returns CPC value, or null if clicks are zero.
   */
  calculateCPC(totalCost: number, totalClicks: number): number | null {
    if (totalClicks === 0) {
      // this.logger.warn('Cannot calculate CPC: totalClicks is zero.');
      return null; // Or Infinity if cost > 0, or 0 if cost is 0
    }
    return totalCost / totalClicks;
  }

  /**
   * Calculates Click-Through Rate.
   * @param totalClicks Total number of clicks.
   * @param totalImpressions Total number of impressions.
   * @returns CTR value (as a decimal, e.g., 0.05 for 5%), or null if impressions are zero.
   */
  calculateCTR(totalClicks: number, totalImpressions: number): number | null {
    if (totalImpressions === 0) {
      // this.logger.warn('Cannot calculate CTR: totalImpressions is zero.');
      return null; // Or 0
    }
    return totalClicks / totalImpressions;
  }

  /**
   * Calculates Conversion Rate.
   * @param totalConversions Total number of conversions.
   * @param totalClicksOrSessions Total number of clicks or sessions that could lead to a conversion.
   * @returns Conversion rate (as a decimal), or null if clicks/sessions are zero.
   */
  calculateConversionRate(totalConversions: number, totalClicksOrSessions: number): number | null {
    if (totalClicksOrSessions === 0) {
      // this.logger.warn('Cannot calculate Conversion Rate: totalClicksOrSessions is zero.');
      return null; // Or 0
    }
    return totalConversions / totalClicksOrSessions;
  }

  /**
   * Calculates Average Order Value.
   * @param totalRevenue Total revenue generated.
   * @param numberOfOrders Total number of orders.
   * @returns AOV value, or null if number of orders is zero.
   */
  calculateAOV(totalRevenue: number, numberOfOrders: number): number | null {
    if (numberOfOrders === 0) {
      // this.logger.warn('Cannot calculate AOV: numberOfOrders is zero.');
      return null; // Or 0
    }
    return totalRevenue / numberOfOrders;
  }
}