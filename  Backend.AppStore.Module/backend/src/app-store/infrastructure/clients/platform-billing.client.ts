import { Injectable, HttpService } from '@nestjs/common'; // HttpService from @nestjs/axios
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// Define interfaces for the details objects for clarity
interface CreateSubscriptionPayload {
  merchantId: string;
  appId: string;
  appName: string;
  pricingModel: string;
  amount: number;
  currency: string;
  billingCycle: string;
  trialDays?: number;
}

interface CreateSubscriptionResponse {
  externalSubscriptionId: string;
  status: string; // 'active', 'trialing', etc.
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
  trialEndDate?: string; // ISO Date string
  renewalDate?: string; // ISO Date string
}

@Injectable()
export class PlatformBillingClient {
  private billingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.billingServiceUrl = this.configService.get<string>('services.platformBilling.url');
  }

  async createAppSubscription(payload: CreateSubscriptionPayload): Promise<CreateSubscriptionResponse> {
    // REQ-8-010
    try {
      const response = await firstValueFrom(
        this.httpService.post<CreateSubscriptionResponse>(`${this.billingServiceUrl}/subscriptions/app`, payload)
      );
      return response.data;
    } catch (error) {
      // console.error('Error creating app subscription via PlatformBillingClient:', error.response?.data || error.message);
      throw new Error(`PlatformBillingClient: Failed to create app subscription - ${error.response?.data?.message || error.message}`);
    }
  }

  async cancelAppSubscription(externalSubscriptionId: string): Promise<void> {
    // REQ-8-010
     try {
      await firstValueFrom(
        this.httpService.delete(`${this.billingServiceUrl}/subscriptions/app/${externalSubscriptionId}`)
      );
    } catch (error) {
      // console.error(`Error cancelling app subscription ${externalSubscriptionId} via PlatformBillingClient:`, error.response?.data || error.message);
      throw new Error(`PlatformBillingClient: Failed to cancel app subscription - ${error.response?.data?.message || error.message}`);
    }
  }

  async callCommissionCalculation(saleDetails: any): Promise<any> {
    // REQ-8-011
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/commissions/calculate`, saleDetails)
      );
      return response.data;
    } catch (error) {
      throw new Error(`PlatformBillingClient: Failed commission calculation - ${error.response?.data?.message || error.message}`);
    }
  }

  async callPayoutProcessing(payoutDetails: any): Promise<any> {
    // REQ-8-012
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/payouts/process`, payoutDetails)
      );
      return response.data;
    } catch (error) {
      throw new Error(`PlatformBillingClient: Failed payout processing - ${error.response?.data?.message || error.message}`);
    }
  }

  async callRefundHandling(refundDetails: any): Promise<any> {
    // REQ-8-013
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.billingServiceUrl}/refunds/handle`, refundDetails)
      );
      return response.data;
    } catch (error) {
      throw new Error(`PlatformBillingClient: Failed refund handling - ${error.response?.data?.message || error.message}`);
    }
  }
}