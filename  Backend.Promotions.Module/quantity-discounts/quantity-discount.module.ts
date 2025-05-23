import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuantityDiscount } from './quantity-discount.entity';
import { QuantityTier } from './quantity-tier.entity'; // QuantityTier is part of this aggregate
import { QuantityDiscountController } from './quantity-discount.controller';
import { QuantityDiscountService } from './quantity-discount.service';
import { QuantityDiscountRepository } from './quantity-discount.repository';

/**
 * REQ-PM-017, REQ-PM-018: Encapsulates Quantity Discount functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QuantityDiscount, QuantityTier]),
  ],
  controllers: [
    // QuantityDiscountController, // To be defined
  ],
  providers: [
    // QuantityDiscountService,
    // {
    //   provide: 'IQuantityDiscountRepository',
    //   useClass: QuantityDiscountRepository,
    // },
  ],
  exports: [
    // QuantityDiscountService,
    // TypeOrmModule,
  ],
})
export class QuantityDiscountModule {}