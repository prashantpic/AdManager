import { Module, Logger } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';

// --- Begin Placeholder Imports for Specific Payment Gateway Modules ---
// These modules would be defined in their respective directories (e.g., ./stripe/stripe.module.ts)
@Module({}) class StripeIntegrationModule {}
@Module({}) class PayPalIntegrationModule {}
@Module({}) class MadaIntegrationModule {}
@Module({}) class StcPayIntegrationModule {}
@Module({}) class PayPalPayoutsIntegrationModule {}
@Module({}) class WisePayoutsIntegrationModule {}
// --- End Placeholder Imports ---

@Module({
  imports: [
    StripeIntegrationModule,
    PayPalIntegrationModule,
    MadaIntegrationModule,
    StcPayIntegrationModule,
    PayPalPayoutsIntegrationModule,
    WisePayoutsIntegrationModule,
    // Potentially other payment gateway integration modules
  ],
  providers: [
    PaymentGatewaysService,
    Logger,
    // --- Begin Placeholder Providers for Specific Gateway/Payout Services ---
    { provide: 'StripeService', useClass: class StripeServicePlaceholder {
        async processPayment(): Promise<any> { throw new Error('Not implemented');}
        async createSubscription(): Promise<any> { throw new Error('Not implemented');}
    }},
    { provide: 'PayPalService', useClass: class PayPalServicePlaceholder {
        async processPayment(): Promise<any> { throw new Error('Not implemented');}
        async createSubscription(): Promise<any> { throw new Error('Not implemented');}
    }},
    { provide: 'MadaService', useClass: class MadaServicePlaceholder {
        async processPayment(): Promise<any> { throw new Error('Not implemented');}
    }},
    { provide: 'StcPayService', useClass: class StcPayServicePlaceholder {
        async processPayment(): Promise<any> { throw new Error('Not implemented');}
    }},
    { provide: 'PayPalPayoutsService', useClass: class PayPalPayoutsServicePlaceholder {
        async processPayout(): Promise<any> { throw new Error('Not implemented');}
    }},
    { provide: 'WisePayoutsService', useClass: class WisePayoutsServicePlaceholder {
        async processPayout(): Promise<any> { throw new Error('Not implemented');}
    }},
    // --- End Placeholder Providers ---
  ],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysIntegrationModule {}