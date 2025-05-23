import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeApiConfig } from './stripe.config';

@Module({
  imports: [ConfigModule],
  providers: [StripeService, StripeApiConfig],
  exports: [StripeService],
})
export class StripeIntegrationModule {}