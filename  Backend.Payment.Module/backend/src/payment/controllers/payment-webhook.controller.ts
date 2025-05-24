import { Controller, Post, Req, Res, HttpStatus, Logger, HttpException } from '@nestjs/common';
import { Request, Response } from 'express'; // Using Express types for raw request/response
import { PaymentService } from '../services/payment.service';
import { RecurringBillingService } from '../services/recurring-billing.service';
import { PaymentGatewayFactory } from '../gateways/payment-gateway.factory';
import { GatewayIdentifier } from '../constants/payment.constants';
import { WebhookEventDto } from '../dto/webhook-event.dto';
import { ConfigService } from '@nestjs/config'; // From CoreModule

@Controller('payment/webhooks')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);
    private readonly webhookSecrets: Record<GatewayIdentifier, string | undefined>;


    constructor(
        private readonly paymentService: PaymentService,
        private readonly recurringBillingService: RecurringBillingService,
        private readonly gatewayFactory: PaymentGatewayFactory,
        private readonly configService: ConfigService, // From CoreModule
    ) {
        // Fetch webhook secrets securely via ConfigService (which should get them from Secrets Manager)
        // Assuming paymentConfig key matches the one registered in payment.config.ts
        this.webhookSecrets = {
            [GatewayIdentifier.STRIPE]: this.configService.get<string>('payment.stripeWebhookSecret'),
            [GatewayIdentifier.PAYPAL]: this.configService.get<string>('payment.paypalWebhookSecret'),
            [GatewayIdentifier.MADA]: this.configService.get<string>('payment.madaWebhookSecret'),
            [GatewayIdentifier.STCPAY]: this.configService.get<string>('payment.stcPayWebhookSecret'),
        };
         this.logger.log('Payment webhook controller initialized. Webhook secrets configured.');
         // Log which secrets are missing (warn level)
         Object.entries(this.webhookSecrets).forEach(([gateway, secret]) => {
             if (!secret) {
                 this.logger.warn(`Webhook secret for ${gateway} is not configured. Webhook verification for this gateway will likely fail.`);
             }
         });
    }

    /**
     * Handles incoming Stripe webhook notifications.
     * @param req - The raw Express request object.
     * @param res - The Express response object.
     */
    @Post('stripe')
    async handleStripeWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
        this.logger.debug('Received Stripe webhook');
        await this.handleWebhook(req, res, GatewayIdentifier.STRIPE);
    }

    /**
     * Handles incoming PayPal webhook notifications.
     * @param req - The raw Express request object.
     * @param res - The Express response object.
     */
    @Post('paypal')
    async handlePayPalWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
         this.logger.debug('Received PayPal webhook');
        await this.handleWebhook(req, res, GatewayIdentifier.PAYPAL);
    }

     /**
     * Handles incoming Mada webhook notifications.
     * @param req - The raw Express request object.
     * @param res - The Express response object.
     */
    @Post('mada')
     async handleMadaWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
         this.logger.debug('Received Mada webhook');
        await this.handleWebhook(req, res, GatewayIdentifier.MADA);
    }

     /**
     * Handles incoming STCPay webhook notifications.
     * @param req - The raw Express request object.
     * @param res - The Express response object.
     */
    @Post('stcpay')
     async handleStcPayWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
         this.logger.debug('Received STCPay webhook');
        await this.handleWebhook(req, res, GatewayIdentifier.STCPAY);
    }


    /**
     * Generic webhook handler function.
     * @param req - The raw Express request object.
     * @param res - The Express response object.
     * @param gatewayIdentifier - The identifier of the gateway.
     */
    private async handleWebhook(
        req: Request,
        res: Response,
        gatewayIdentifier: GatewayIdentifier,
    ): Promise<void> {
        const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'] || req.headers['x-mada-signature'] || req.headers['x-stcpay-signature'] || ''; // Get signature from headers
        const webhookSecret = this.gatewayFactory.getWebhookSecret(gatewayIdentifier);

        if (!webhookSecret) {
             this.logger.error(`Webhook secret not configured for gateway: ${gatewayIdentifier}. Cannot verify signature.`);
             res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook secret not configured');
             return;
        }

        // Ensure the raw body is available for signature verification
        // This might require body-parser configuration in the main app (e.g., use rawBody)
        const rawBody = (req as any).rawBody;
         if (!rawBody) {
             this.logger.error('Raw request body not available for webhook signature verification.');
             res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Raw body not available');
             return;
         }


        try {
            const gateway = this.gatewayFactory.getGateway(gatewayIdentifier);

            // 1. Verify signature
            const isSignatureValid = gateway.verifyWebhookSignature(rawBody, signature as string, webhookSecret);

            if (!isSignatureValid) {
                 this.logger.warn(`Webhook signature verification failed for ${gatewayIdentifier}.`);
                // Use 400 Bad Request or 401 Unauthorized for signature failures
                res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
                return;
            }

            this.logger.debug(`Webhook signature verified successfully for ${gatewayIdentifier}.`);

            // 2. Parse the event payload
            // The parsing step should happen AFTER verification, often using the raw body or verified object.
            // Depending on the adapter implementation, parseWebhookEvent might take the raw body or the verified object.
            // Let's assume parseWebhookEvent takes the raw body/payload.
            const event = gateway.parseWebhookEvent(req.body); // req.body is the parsed JSON

            // 3. Route the event to the appropriate service handler based on event type
            // Determine if it's a one-time payment event or a recurring billing event
            // This logic is gateway-specific and depends on the event.eventType naming convention.
            // Example logic based on common patterns:
            if (event.eventType.startsWith('charge.') || event.eventType.startsWith('PAYMENT.CAPTURE.')) {
                 // One-time payment event (e.g., Stripe charge, PayPal capture)
                 await this.paymentService.handleWebhookPaymentEvent(event);
            } else if (event.eventType.startsWith('customer.subscription.') || event.eventType.startsWith('invoice.') || event.eventType.startsWith('BILLING.SUBSCRIPTION.') || event.eventType.startsWith('PAYMENT.SALE.')) {
                 // Recurring billing event (e.g., Stripe subscription/invoice, PayPal subscription/sale)
                 await this.recurringBillingService.handleWebhookSubscriptionEvent(event);
            } else {
                // Ignore unknown event types
                 this.logger.log(`Ignoring unknown webhook event type: ${event.gateway} - ${event.eventType}`);
            }

            // 4. Acknowledge receipt to the gateway
            // Respond with 200 OK immediately after receiving and validating the webhook, before async processing starts, if possible.
            // Or respond after successful parsing and queuing for processing.
            // Standard practice is to respond quickly (within seconds) to avoid timeouts.
            // Processing should ideally be asynchronous (e.g., queueing the event).
            // Given the current synchronous service calls, we respond after the service call finishes.
            // A more robust system would queue the event to SQS here and respond 200 immediately.
            // For this sync example, responding after the service handles it.
            res.status(HttpStatus.OK).send('Webhook received and processed');

        } catch (error) {
            this.logger.error(`Error handling webhook for ${gatewayIdentifier}: ${error.message}`, error.stack);

            // Respond with an error status code to the gateway to signal failure, potentially triggering retries.
            // Avoid leaking internal error details.
            if (error instanceof HttpException) {
                 res.status(error.getStatus()).send(error.getResponse());
            } else {
                 res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal server error processing webhook');
            }
        }
    }
}