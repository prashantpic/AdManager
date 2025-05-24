```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter'; // For domain events

import { OrderController } from './order.controller';

// Application Layer
import { OrderService } from './application/services/order.service';
import { CheckoutService } from './application/services/checkout.service';
import { OrderMapper } from './application/mappers/order.mapper';
import { OrderPlacedHandler } from './application/event-handlers/order-placed.handler';

// Domain Layer
import { IOrderRepository } from './domain/interfaces/order.repository.interface';
import { ICustomerDataProvider } from './domain/interfaces/customer-data.provider.interface';
import { IProductProvider } from './domain/interfaces/product.provider.interface';
import { IPromotionProvider } from './domain/interfaces/promotion.provider.interface';
import { IPaymentProvider } from './domain/interfaces/payment.provider.interface';
import { IShippingProvider } from './domain/interfaces/shipping.provider.interface';
import { OrderCalculationService } from './domain/services/order-calculation.service';

// Infrastructure Layer
import { TypeOrmOrderRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-order.repository';
import { OrderTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/order.typeorm-entity';
import { LineItemTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/line-item.typeorm-entity';
import { TypeOrmOrderMapper } from './infrastructure/persistence/typeorm/mappers/typeorm-order.mapper';
import { ProductCatalogAdapter } from './infrastructure/providers/product-catalog.adapter';
import { PromotionAdapter } from './infrastructure/providers/promotion.adapter';
import { UserAuthAdapter } from './infrastructure/providers/user-auth.adapter';
import { PaymentAdapter } from './infrastructure/providers/payment.adapter';
import { ShippingAdapter } from './infrastructure/providers/shipping.adapter';
import { SqsOrderEventPublisher } from './infrastructure/event-publishers/sqs-order-event.publisher';

// Assuming CoreModule would provide SqsService, if not, it should be imported/provided directly
// import { CoreModule } from '@core/core.module'; // Example

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderTypeOrmEntity,
      LineItemTypeOrmEntity,
      // Embeddables are not registered here; they are part of their parent entities
    ]),
    EventEmitterModule.forRoot(), // For internal domain event handling
    // CoreModule, // If CoreModule provides shared services like SqsService or logging
  ],
  controllers: [OrderController],
  providers: [
    // Application Services
    OrderService,
    CheckoutService,

    // Application Mappers
    OrderMapper,

    // Application Event Handlers
    OrderPlacedHandler,

    // Domain Services
    OrderCalculationService,

    // Domain Interface Bindings to Infrastructure Implementations
    {
      provide: IOrderRepository,
      useClass: TypeOrmOrderRepository,
    },
    {
      provide: ICustomerDataProvider,
      useClass: UserAuthAdapter,
    },
    {
      provide: IProductProvider,
      useClass: ProductCatalogAdapter,
    },
    {
      provide: IPromotionProvider,
      useClass: PromotionAdapter,
    },
    {
      provide: IPaymentProvider,
      useClass: PaymentAdapter,
    },
    {
      provide: IShippingProvider,
      useClass: ShippingAdapter,
    },

    // Infrastructure Mappers
    TypeOrmOrderMapper,

    // Infrastructure Adapters (also bound above)
    ProductCatalogAdapter,
    PromotionAdapter,
    UserAuthAdapter,
    PaymentAdapter,
    ShippingAdapter,

    // Infrastructure Event Publishers
    SqsOrderEventPublisher,

    // Infrastructure Repositories (also bound above)
    // TypeOrmOrderRepository, // Already provided via IOrderRepository
  ],
  exports: [
    OrderService, // For potential use by other modules directly (less ideal for strict modularity)
    CheckoutService,
    // Consider exporting interfaces if other modules need to depend on this module's contracts,
    // though adapters are usually the preferred way for this module to depend on others.
    // IOrderRepository, // Typically not exported if direct DB access from other modules is discouraged
  ],
})
export class OrderModule {}
```