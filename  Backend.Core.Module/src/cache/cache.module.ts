import { Module, Global } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { CacheService } from './cache.service';
import { ICacheService } from './cache.interface'; // Assuming this interface exists
import { CoreConfigModule } from '../config/config.module';
import { CoreConfigService } from '../config/config.service';
import { SecretsModule } from '../config/secrets/secrets.module';
import { SecretsService } from '../config/secrets/secrets.service';
import { redisConfigFactory } from './redis.config'; // Assuming this factory exists

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global() // Making CacheService available globally, or import CoreCacheModule where needed
@Module({
  imports: [CoreConfigModule, SecretsModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (
        configService: CoreConfigService,
        secretsService: SecretsService,
      ): Promise<Redis> => {
        const options: RedisOptions = await redisConfigFactory(
          configService,
          secretsService,
        );
        const client = new Redis(options);

        client.on('error', (err) => {
          console.error('Redis Client Error:', err); // Replace with structured logger
        });
        client.on('connect', () => {
          console.log('Connected to Redis'); // Replace with structured logger
        });
        client.on('ready', () => {
            console.log('Redis client ready'); // Replace with structured logger
        });

        return client;
      },
      inject: [CoreConfigService, SecretsService],
    },
    {
      provide: ICacheService, // Use an injection token for the interface
      useClass: CacheService,
    },
  ],
  exports: [ICacheService], // Export the interface token
})
export class CoreCacheModule {}