import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralOffer } from './general-offer.entity';
import { GeneralOfferController } from './general-offer.controller';
import { GeneralOfferService } from './general-offer.service';
import { GeneralOfferRepository } from './general-offer.repository';

/**
 * REQ-PM-012, REQ-PM-013: Encapsulates General Offer functionalities.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([GeneralOffer]),
  ],
  controllers: [
    // GeneralOfferController, // To be defined
  ],
  providers: [
    // GeneralOfferService,
    // {
    //   provide: 'IGeneralOfferRepository',
    //   useClass: GeneralOfferRepository,
    // },
  ],
  exports: [
    // GeneralOfferService,
    // TypeOrmModule,
  ],
})
export class GeneralOfferModule {}