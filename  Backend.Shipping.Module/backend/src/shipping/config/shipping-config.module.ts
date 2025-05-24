import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService as NestConfigService } from '@nestjs/config';
import shippingConfig from './shipping.config';
import { ShippingConfigService } from './shipping-config.service';

@Global() // Making this global allows ShippingConfigService to be injected anywhere in the ShippingModule
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [shippingConfig], // Load the shipping-specific configuration
      // Optional: Add Joi or class-validator based validation schema for shippingConfig here
      // validationSchema: shippingConfigValidationSchema,
      // envFilePath: ['.env.shipping', '.env'], // Example: specify custom env file paths
      // ignoreEnvFile: process.env.NODE_ENV === 'production', // Example: ignore .env in production
    }),
  ],
  providers: [
    NestConfigService, // NestJS's own ConfigService
    ShippingConfigService, // Our typed wrapper service
  ],
  exports: [
    ShippingConfigService, // Export our typed service for use in the ShippingModule
  ],
})
export class ShippingConfigModule {}