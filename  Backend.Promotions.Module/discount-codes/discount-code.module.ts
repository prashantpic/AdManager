import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCode } from './discount-code.entity';
import { DiscountCodeController } from './discount-code.controller';
import { DiscountCodeService } from './discount-code.service';
import { DiscountCodeRepository } from './discount-code.repository';
import { DiscountCodeGeneratorUtil } from './utils/discount-code-generator.util';
// Assuming CoreModule provides shared services like ConfigService or logging
// import { CoreModule } from '@admanager/backend-core-module';

/**
 * REQ-PM-001 to REQ-PM-008: Encapsulates all Discount Code related functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DiscountCode]),
    // CoreModule, // If shared services from CoreModule are needed
  ],
  controllers: [
    // DiscountCodeController will be defined in a future iteration
    // For now, this shows its intended place.
    // DiscountCodeController,
  ],
  providers: [
    // DiscountCodeService,
    // DiscountCodeGeneratorUtil,
    // {
    //   provide: 'IDiscountCodeRepository',
    //   useClass: DiscountCodeRepository,
    // },
    // These providers will be fully defined when their respective files are generated.
    // For now, this structure indicates the intended components of this module.
  ],
  exports: [
    // DiscountCodeService,
    // 'IDiscountCodeRepository',
    // TypeOrmModule, // Exporting TypeOrmModule.forFeature([DiscountCode]) if other modules need direct access to this entity repo
  ],
})
export class DiscountCodeModule {}