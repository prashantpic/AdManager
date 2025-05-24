import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule as NestConfigModule } from '@nestjs/config'; // Renamed to avoid conflict

import { SubscriptionPlanController } from './controllers/subscription-plan.controller';
import { MerchantSubscriptionController } from './controllers/merchant-subscription.controller';

import { SubscriptionPlanService } from './services/subscription-plan.service';
import { MerchantSubscriptionService } from './services/merchant-subscription.service';
import { BillingService } from './services/billing.service';

import { TypeOrmSubscriptionPlanRepository } from './repositories/typeorm-subscription-plan.repository';
import { TypeOrmMerchantSubscriptionRepository } from './repositories/typeorm-merchant-subscription.repository';

import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { MerchantSubscriptionEntity } from './entities/merchant-subscription.entity';

import { SubscriptionPlanMapper } from './mappers/subscription-plan.mapper';
import { MerchantSubscriptionMapper } from './mappers/merchant-subscription.mapper';

import { ProrationCalculatorDomainService } from './domain/services/proration-calculator.domain-service';

import { PlanEventsListener } from './listeners/plan-events.listener';
import { PaymentEventsListener } from './listeners/payment-events.listener';
import { SubscriptionEventsListener } from './listeners/subscription-events.listener';

import { SubscriptionRenewalJob } from './jobs/subscription-renewal.job';
import { DunningCycleJob } from './jobs/dunning-cycle.job';

// Placeholder for configurations - in a real app, this might be more structured
// import { subscriptionConfig } from './config/subscription.config'; // If using a config loader
import { SUBSCRIPTION_CONFIG_TOKEN } from './constants';
import { SubscriptionModuleConfig } from './config';

// Placeholder imports for external module dependencies (guards, services)
// These would typically be imported from their respective modules if they are part of the same monorepo
// For this exercise, they are assumed to be available for injection or use.

// Assume AdminAuthGuard and AuthGuard are provided by an AuthModule
// import { AdminAuthGuard } from '../../user-auth/guards/admin-auth.guard';
// import { AuthGuard } from '../../user-auth/guards/auth.guard';

// Assume services from other modules
// import { PaymentGatewayService } from '../../integration/services/payment-gateway.service';
// import { NotificationService } from '../../notification/services/notification.service';
// import { EntitlementService } from '../../entitlement/services/entitlement.service';
// import { LoggerService } from '../../core/services/logger.service'; // Assuming a core logger

@Module({
  imports: [
    NestConfigModule.forFeature(() => {
      // This is a simplified way to load config.
      // In a real app, you might use a separate config file or environment variables.
      // For now, let's provide a default or mock configuration.
      return {
        dunningRetryAttempts: 3,
        prorationPolicy: 'prorata',
        // other config properties
      } as SubscriptionModuleConfig;
    }),
    TypeOrmModule.forFeature([SubscriptionPlanEntity, MerchantSubscriptionEntity]),
    EventEmitterModule.forRoot({
      wildcard: true, // Enable wildcard for subscription.status.*
      delimiter: '.', // Delimiter for wildcard matching
    }),
    ScheduleModule.forRoot(),
    // Example: if UserAuthModule provides AdminAuthGuard and AuthGuard globally or exports them
    // UserAuthModule,
    // CoreModule, // For LoggerService
    // IntegrationModule, // For PaymentGatewayService
    // NotificationModule, // For NotificationService
    // EntitlementModule, // For EntitlementService
  ],
  controllers: [SubscriptionPlanController, MerchantSubscriptionController],
  providers: [
    SubscriptionPlanService,
    MerchantSubscriptionService,
    BillingService,
    ProrationCalculatorDomainService,
    {
      provide: 'ISubscriptionPlanRepository',
      useClass: TypeOrmSubscriptionPlanRepository,
    },
    {
      provide: 'IMerchantSubscriptionRepository',
      useClass: TypeOrmMerchantSubscriptionRepository,
    },
    SubscriptionPlanMapper,
    MerchantSubscriptionMapper,
    PlanEventsListener,
    PaymentEventsListener,
    SubscriptionEventsListener,
    SubscriptionRenewalJob,
    DunningCycleJob,
    Logger, // Providing NestJS built-in logger for simplicity
    // Placeholder for actual services if not provided by dedicated modules
    // { provide: 'PaymentGatewayService', useValue: { charge: async () => ({ success: true, transactionId: 'mock-tx' }), refund: async () => ({ success: true, refundId: 'mock-ref' }) } },
    // { provide: 'NotificationService', useValue: { sendEmail: async () => {}, sendDunningNotification: async () => {} } },
    // { provide: 'EntitlementService', useValue: { updateEntitlements: async () => {} } },
    // { provide: 'LoggerService', useClass: Logger }, // Use NestJS Logger as a stand-in for a custom LoggerService
  ],
  exports: [
    SubscriptionPlanService,
    MerchantSubscriptionService,
    BillingService,
    'ISubscriptionPlanRepository',
    'IMerchantSubscriptionRepository',
  ],
})
export class SubscriptionModule {}