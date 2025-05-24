import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntegrationModule } from '../integration/integration.module'; // Simulated Import
import { UserAuthModule } from '../user-auth/user-auth.module'; // Simulated Import
import { CoreModule } from '../core/core.module'; // Simulated Import
import { PaymentPersistenceModule } from './persistence/payment-persistence.module';
import { PaymentService } from './services/payment.service';
import { RecurringBillingService } from './services/recurring-billing.service';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { StripeAdapter } from './gateways/adapters/stripe.adapter';
import { PayPalAdapter } from './gateways/adapters/paypal.adapter';
import { MadaAdapter } from './gateways/adapters/mada.adapter';
import { StcPayAdapter } from './gateways/adapters/stcpay.adapter';
import { DefaultDunningStrategy } from './strategies/dunning/default-dunning.strategy';
import { IDunningStrategy } from './strategies/dunning/dunning.strategy.interface';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { paymentConfig } from './config/payment.config';
// import { NotificationModule } from '../notification/notification.module'; // Simulated Import (Optional)


@Module({
  imports: [
    ConfigModule.forFeature(paymentConfig),
    // Import necessary modules from the Core layer and other domains
    CoreModule, // Provides LoggerService, ConfigService, etc.
    IntegrationModule, // Provides gateway clients
    UserAuthModule, // Needed if guards or user/merchant lookups are done within PaymentModule controllers/services
    PaymentPersistenceModule, // Provides PaymentTransactionLogRepository
    // forwardRef(() => OrderModule), // Example: If OrderModule needs PaymentService and PaymentModule needs OrderModule (circular)
    // forwardRef(() => NotificationModule), // Optional: if using NotificationService in dunning/services
  ],
  controllers: [PaymentWebhookController],
  providers: [
    // Services
    PaymentService,
    RecurringBillingService,

    // Gateway Factory and Adapters
    PaymentGatewayFactory,
    StripeAdapter,
    PayPalAdapter,
    MadaAdapter,
    StcPayAdapter,
    // Add other gateway adapters here

    // Dunning Strategy
    {
        provide: IDunningStrategy, // Bind the interface to the concrete strategy
        useClass: DefaultDunningStrategy,
    },
    // Add other dunning strategies and conditional provisioning if needed
  ],
  exports: [
    // Export services that other modules (like OrderModule or a MerchantSubscriptionModule) will use
    PaymentService,
    RecurringBillingService,
    PaymentGatewayFactory, // Export factory if other modules need to interact with adapters directly (less common)
    IDunningStrategy, // Export the strategy if needed elsewhere
    PaymentPersistenceModule, // Export persistence if other modules need direct repo access (less common)
  ],
})
export class PaymentModule {}