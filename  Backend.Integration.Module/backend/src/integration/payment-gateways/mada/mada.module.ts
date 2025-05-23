import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MadaService } from './mada.service';
import { MadaApiConfig } from './mada.config'; // Assuming MadaApiConfig exists

@Module({
  imports: [ConfigModule],
  providers: [MadaService, MadaApiConfig], // Provide MadaApiConfig
  exports: [MadaService],
})
export class MadaIntegrationModule {}