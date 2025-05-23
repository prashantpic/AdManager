```typescript
import { Controller, Post, Body, Logger, UseGuards, Req, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ZapierService } from './zapier.service';
// import { ZapierAuthGuard } from './zapier-auth.guard'; // Assume a guard for authenticating Zapier requests

// Placeholder for a Zapier Auth Guard
// @Injectable()
// export class ZapierAuthGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//     const apiKey = request.headers['x-api-key']; // Or however Zapier auth is handled
//     // Validate API key against a stored key (e.g., from ConfigService)
//     return apiKey === process.env.ZAPIER_API_KEY; 
//   }
// }

// Request DTOs for Zapier interactions
class ZapierSubscribeDto {
  merchantId: string; // Usually passed by Zapier if platform is multi-tenant
  targetUrl: string; // Zapier's webhook URL
  event: string; // e.g., 'new_order'
}

class ZapierActionDto {
  merchantId: string;
  actionType: string; // e.g., 'create_discount'
  data: any; // Data for the action
}


@Controller('integrations/zapier') // Base path for Zapier related endpoints
// @UseGuards(ZapierAuthGuard) // Apply auth guard to all routes in this controller
export class ZapierController {
  private readonly logger = new Logger(ZapierController.name);

  constructor(private readonly zapierService: ZapierService) {}

  // Endpoint for Zapier to subscribe to webhooks
  @Post('webhooks/subscribe')
  async handleWebhookSubscription(@Body() body: ZapierSubscribeDto): Promise<any> {
    this.logger.log(`Received Zapier webhook subscription request:`, body);
    // merchantId might be derived from authenticated Zapier user/API key if not in body
    const { merchantId, targetUrl, event } = body; 
    const hookId = await this.zapierService.subscribeToWebhook(merchantId, targetUrl, event);
    return { hookId, message: `Successfully subscribed to ${event}.` };
  }

  // Endpoint for Zapier to unsubscribe from webhooks
  // Zapier usually sends a DELETE request to the targetUrl they subscribed with,
  // or a specific unsubscribe endpoint. This example assumes a specific endpoint.
  @Delete('webhooks/:hookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleWebhookUnsubscription(
    @Param('hookId') hookId: string,
    @Body('merchantId') merchantId: string, // Or get merchantId from auth context
  ): Promise<void> {
    this.logger.log(`Received Zapier webhook unsubscription request for hook ID: ${hookId}`);
    await this.zapierService.unsubscribeFromWebhook(merchantId, hookId);
  }
  
  // Endpoint for Zapier to request sample data for a trigger
  @Post('triggers/:triggerName/samples')
  async getTriggerSamples(
    @Param('triggerName') triggerName: string,
    @Body('merchantId') merchantId: string, // Or from auth context
  ): Promise<any[]> {
    this.logger.log(`Zapier requesting samples for trigger '${triggerName}' for merchant ${merchantId}`);
    if (triggerName === 'new_order') {
        return this.zapierService.getNewOrderSamples(merchantId);
    }
    // Add other sample data providers based on triggerName
    return [];
  }


  // Endpoint for Zapier to execute an action
  // Zapier typically makes one POST endpoint per action type for clarity, or a generic one.
  @Post('actions/execute')
  async handleActionExecution(@Body() body: ZapierActionDto): Promise<any> {
    this.logger.log(`Received Zapier action execution request:`, body);
    const { merchantId, actionType, data } = body;

    if (actionType === 'create_discount') {
      return this.zapierService.performCreateDiscountAction(merchantId, data);
    }
    // Add other action handlers based on actionType

    this.logger.warn(`Unknown action type received from Zapier: ${actionType}`);
    return { error: `Unknown action type: ${actionType}` };
  }

  // This is an example of an endpoint Zapier would call if the platform itself
  // triggers a webhook to Zapier (e.g., a new order is created).
  // However, usually, the platform POSTs to the `targetUrl` Zapier provided during subscription.
  // This endpoint would be if Zapier needs to poll or if this platform hosts the webhook handler.
  // For most Zapier apps, the platform calls Zapier, not the other way around for event notifications.
  // The `zapierService.triggerZapierWebhook` would handle the outbound call.
}
```