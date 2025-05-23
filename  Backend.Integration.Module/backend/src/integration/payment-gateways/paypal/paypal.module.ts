import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayPalService } from './paypal.service';
import { PayPalApiConfig } from './paypal.config';
// Assuming HttpClientService is provided by a common/core module

@Module({
  imports: [ConfigModule],
  providers: [PayPalService, PayPalApiConfig],
  exports: [PayPalService],
})
export class PayPalIntegrationModule {}