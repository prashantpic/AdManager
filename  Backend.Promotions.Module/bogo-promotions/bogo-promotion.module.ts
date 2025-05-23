import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BogoPromotion } from './bogo-promotion.entity';
import { BogoPromotionController } from './bogo-promotion.controller';
import { BogoPromotionService } from './bogo-promotion.service';
import { BogoPromotionRepository } from './bogo-promotion.repository';

/**
 * REQ-PM-009, REQ-PM-010, REQ-PM-011: Encapsulates BOGO promotion functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BogoPromotion]),
  ],
  controllers: [
    // BogoPromotionController, // To be defined
  ],
  providers: [
    // BogoPromotionService,
    // {
    //   provide: 'IBogoPromotionRepository',
    //   useClass: BogoPromotionRepository,
    // },
  ],
  exports: [
    // BogoPromotionService,
    // TypeOrmModule,
  ],
})
export class BogoPromotionModule {}