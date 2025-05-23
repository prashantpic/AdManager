import { Module, Provider, Global, Logger } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { SecretsModule } from '../config/secrets/secrets.module';
import { SecretsService } from '../config/secrets/secrets.service';
import { CacheService } from './cache.service';
import { ICacheService } from './cache.interface';
import { redisConfig } from './redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisClientProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: async (
    configService: CoreConfigService,
    secretsService: SecretsService,
  ): Promise<Redis> => {
    const options: RedisOptions = await redisConfig(
      configService,
      secretsService,
    );
    const logger = new Logger('RedisConnection');
    const client = new Redis(options);

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });
    client.on('connect', () => {
      logger.log('Connected to Redis server.');
    });
    client.on('ready', () => {
      logger.log('Redis client ready.');
    });
    client.on('reconnecting', () => {
      logger.log('Reconnecting to Redis server...');
    });

    return client;
  },
  inject: [CoreConfigService, SecretsService],
};

@Global() // Making CacheService globally available without importing CoreCacheModule
@Module({
  imports: [CoreConfigModule, SecretsModule],
  providers: [
    redisClientProvider,
    {
      provide: ICacheService,
      useClass: CacheService,
    },
  ],
  exports: [ICacheService],
})
export class CoreCacheModule {}