```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CoreConfigService } from '../../config/config.service';
import { ISecretsService } from '../../config/secrets/secrets.interface';
// TODO: Import BaseEntity and other entities once defined
// import { BaseEntity } from './base.entity';

/**
 * TypeORM configuration factory.
 * Dynamically creates TypeORM connection options using configuration and secrets services.
 * @param configService - The core configuration service.
 * @param secretsService - The secrets management service.
 * @returns A promise resolving to TypeOrmModuleOptions.
 */
export const typeOrmConfigFactory = async (
  configService: CoreConfigService,
  secretsService: ISecretsService,
): Promise<TypeOrmModuleOptions> => {
  // REQ-14-012: Database credentials should be fetched from Secrets Manager
  const dbPassword = await secretsService.getSecret<string>(
    'DB_PASSWORD_SECRET_NAME', // Replace with actual secret name/ARN
  );

  // REQ-15-002: SSL must be enabled for RDS connections.
  // SSL options might depend on the environment or specific RDS setup.
  // For AWS RDS, often requires downloading the CA bundle.
  const sslOptions: any = {
    rejectUnauthorized: configService.getDbSslRejectUnauthorized(),
  };
  if (configService.getDbCaCert()) {
    sslOptions.ca = configService.getDbCaCert(); // Path to CA cert or cert content
  }


  return {
    type: 'postgres',
    host: configService.getDbHost(),
    port: configService.getDbPort(),
    username: configService.getDbUsername(),
    password: dbPassword, // From Secrets Manager
    database: configService.getDbDatabase(),
    entities: [
        // __dirname + '/../../**/*.entity{.ts,.js}', // Path from dist
        // 'dist/**/*.entity.js' // More common path for NestJS build
        // TODO: Update this path based on project structure and entity locations
        // It should point to where your compiled .entity.js files will be.
        // BaseEntity and other entities should be included here.
        // For example: [User, Product, Order, BaseEntity]
        // Or using pattern: join(__dirname, '../..', '**', '*.entity.{ts,js}')
        'dist/**/*.entity{.ts,.js}',
    ],
    // TODO: Configure migrations path
    // migrationsTableName: 'migrations',
    // migrations: ['dist/database/migrations/*{.ts,.js}'],
    // cli: {
    //   migrationsDir: 'src/database/migrations',
    // },
    synchronize: configService.getNodeEnv() === 'development', // REQ-16-007: Set to false in production
    logging: configService.getTypeOrmLogging(), // Use NestJS logger or 'all' for TypeORM specific logging
    ssl: configService.getNodeEnv() === 'production' ? sslOptions : false, // Enforce SSL in production
    autoLoadEntities: true, // Can simplify entity loading if entities are defined in modules
    keepConnectionAlive: true, // Useful for serverless environments or tests
  };
};
```