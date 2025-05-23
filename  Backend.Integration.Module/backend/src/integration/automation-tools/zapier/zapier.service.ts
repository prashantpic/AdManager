```typescript
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Assume a secure way to store and manage webhook subscriptions, e.g., via a CoreModule repository
// For this example, we'll use an in-memory store.

interface WebhookSubscription {
  id: string;
  merchantId: string;
  targetUrl: string;
  event: string; // e.g., 'new_order', 'updated_product'
  createdAt: Date;
}

// Placeholder for other module services Zapier might interact with
// E.g., OrderService, DiscountService from other backend modules

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);
  private readonly webhookSubscriptions: Map<string, WebhookSubscription> = new Map();

  constructor(
    private readonly configService: ConfigService,
    // @Inject('OrderService') private readonly orderService: any, // Example dependency
    // @Inject('DiscountService') private readonly discountService: any, // Example dependency
  ) {}

  // Example: Provides sample data for a "New Order" trigger
  public async getNewOrderSamples(merchantId: string): Promise<any[]> {
    this.logger.log(`Fetching new order samples for merchant ${merchantId}`);
    // In a real app, fetch actual sample orders (or mock ones)
    // return this.orderService.getRecentOrders(merchantId, 3);
    return [
      { id: 'order_123', amount: 100, currency: 'USD', customer_email: 'test1@example.com', created_at: new Date().toISOString() },
      { id: 'order_124', amount: 150, currency: 'USD', customer_email: 'test2@example.com', created_at: new Date().toISOString() },
    ];
  }

  // Example: Subscribes Zapier to a webhook for a specific event
  public async subscribeToWebhook(merchantId: string, targetUrl: string, event: string): Promise<string> {
    if (!targetUrl || !event) {
      throw new BadRequestException('Target URL and event type are required for webhook subscription.');
    }
    this.logger.log(`Subscribing merchant ${merchantId} to event '${event}' at URL: ${targetUrl}`);
    
    // Basic validation for URL format (Zapier usually provides valid URLs)
    try {
        new URL(targetUrl);
    } catch (error) {
        throw new BadRequestException('Invalid target URL format.');
    }

    const hookId = `hook_${merchantId}_${event}_${Date.now()}`; // Simple unique ID
    const subscription: WebhookSubscription = {
      id: hookId,
      merchantId,
      targetUrl,
      event,
      createdAt: new Date(),
    };
    this.webhookSubscriptions.set(hookId, subscription);
    // Persist this subscription to a database in a real application
    this.logger.log(`Webhook subscription created with ID: ${hookId}`);
    return hookId; // Zapier usually expects the hook ID or subscription details back
  }

  // Example: Unsubscribes Zapier from a webhook
  public async unsubscribeFromWebhook(merchantId: string, hookId: string): Promise<void> {
    this.logger.log(`Unsubscribing merchant ${merchantId} from webhook ID: ${hookId}`);
    const subscription = this.webhookSubscriptions.get(hookId);
    if (!subscription || subscription.merchantId !== merchantId) {
      throw new NotFoundException(`Webhook subscription with ID ${hookId} not found for this merchant.`);
    }
    this.webhookSubscriptions.delete(hookId);
    // Remove from persistent storage in a real application
    this.logger.log(`Webhook subscription ${hookId} removed.`);
  }

  // Example: Performs an action, like creating a discount
  public async performCreateDiscountAction(merchantId: string, discountData: any): Promise<any> {
    this.logger.log(`Performing 'create discount' action for merchant ${merchantId} with data:`, discountData);
    // Validate discountData
    // Call the actual discount creation logic (e.g., from a PromotionsModule service)
    // return this.discountService.createDiscount(merchantId, discountData);
    const createdDiscount = {
      id: `discount_${Date.now()}`,
      code: discountData.code || `ZAPCODE${Date.now()}`,
      type: discountData.type || 'percentage',
      value: discountData.value || 10,
      merchantId,
      ...discountData,
    };
    this.logger.log('Discount created successfully (mocked):', createdDiscount);
    return createdDiscount; // Return the result of the action
  }

  // Method to be called when an internal event happens (e.g., new order created)
  // This would then find relevant webhooks and send data to Zapier's target URLs.
  // This part is complex and involves HttpClientService to make outbound calls.
  public async triggerZapierWebhook(event: string, merchantId: string, payload: any): Promise<void> {
    this.logger.log(`Internal event '${event}' triggered for merchant ${merchantId}. Checking Zapier webhooks.`);
    // This is a simplified representation. HttpClientService should be used for actual POST.
    // const httpClient = new HttpClientService(...); // Needs proper DI

    for (const sub of this.webhookSubscriptions.values()) {
        if (sub.merchantId === merchantId && sub.event === event) {
            this.logger.log(`Sending payload to Zapier webhook: ${sub.targetUrl} for event ${event}`);
            try {
                // await httpClient.post(sub.targetUrl, payload, { headers: {'Content-Type': 'application/json'} });
                // In a real scenario, use the injected HttpClientService
                // For now, just log it.
                this.logger.log(`Mock POST to ${sub.targetUrl} with payload: ${JSON.stringify(payload)}`);
            } catch (error) {
                this.logger.error(`Failed to send webhook to ${sub.targetUrl}`, error);
                // Implement retry or dead-letter queue for failed webhooks.
            }
        }
    }
  }
}
```