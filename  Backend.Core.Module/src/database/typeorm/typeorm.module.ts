import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreConfigModule } from '../../config/config.module';
import { CoreConfigService } from '../../config/config.service';
import { SecretsModule } from '../../config/secrets/secrets.module';
import { SecretsService } from '../../config/secrets/secrets.service';
import { typeOrmConfigFactory } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [CoreConfigModule, SecretsModule],
      useFactory: typeOrmConfigFactory,
      inject: [CoreConfigService, SecretsService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class CoreTypeOrmModule {}