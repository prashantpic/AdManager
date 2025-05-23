import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WisePayoutsService } from './wise.service';
import { WiseApiConfig } from './wise.config'; // Assuming this config file exists

@Module({
  imports: [ConfigModule],
  providers: [WisePayoutsService, WiseApiConfig],
  exports: [WisePayoutsService],
})
export class WisePayoutsIntegrationModule {}