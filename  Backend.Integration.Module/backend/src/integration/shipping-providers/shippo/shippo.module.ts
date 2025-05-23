import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippoService } from './shippo.service';
import { ShippoApiConfig } from './shippo.config';

@Module({
  imports: [ConfigModule],
  providers: [ShippoService, ShippoApiConfig],
  exports: [ShippoService],
})
export class ShippoIntegrationModule {}