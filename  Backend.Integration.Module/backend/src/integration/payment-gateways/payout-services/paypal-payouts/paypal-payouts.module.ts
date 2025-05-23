import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayPalPayoutsService } from './paypal-payouts.service';
import { PayPalPayoutsApiConfig } from './paypal-payouts.config'; // Assuming this config file exists

@Module({
  imports: [ConfigModule],
  providers: [PayPalPayoutsService, PayPalPayoutsApiConfig],
  exports: [PayPalPayoutsService],
})
export class PayPalPayoutsIntegrationModule {}