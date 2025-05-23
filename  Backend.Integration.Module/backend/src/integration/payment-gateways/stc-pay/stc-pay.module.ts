import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StcPayService } from './stc-pay.service';
import { StcPayApiConfig } from './stc-pay.config'; // Assuming StcPayApiConfig exists

@Module({
  imports: [ConfigModule],
  providers: [StcPayService, StcPayApiConfig], // Provide StcPayApiConfig
  exports: [StcPayService],
})
export class StcPayIntegrationModule {}