```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CoreConfigService } from '../../config/config.service';
import { ISecretsService } from '../../config/secrets/secrets.interface';
import { LoggerOptions } from 'typeorm/driver/DriverOptions';
import * as path from 'path';

// Assuming BaseEntity and other entities will be in 'dist/**/*.entity.js' post-compilation
// For development with ts-node, 'src/**/*.entity.ts' might also be needed or a dynamic path.
const entitiesPath = path.join(__dirname, '/../../**/*.entity{.ts,.js}'); // More robust path
const migrationsPath = path.join(__dirname, '/../../../migrations/*{.ts,.js}');


/**
 * @function typeOrmConfigFactory
 * @description Dynamic configuration factory for TypeORM.
 * Retrieves database connection parameters (host, port, username, password, database name)
 * from `CoreConfigService` and `SecretsService`.
 * REQ-11-008, REQ-14-004, REQ-16-007, REQ-14-012, REQ-15-002
 * @param coreConfigService - Service for accessing general application configuration.
 * @param secretsService - Service for retrieving secrets like database passwords.
 * @returns A promise resolving to TypeOrmModuleOptions.
 */
export const typeOrmConfigFactory = async (
  coreConfigService: CoreConfigService,
  secretsService: ISecretsService,
): Promise<TypeOrmModuleOptions> => {
  const dbPasswordSecretName = coreConfigService.getDatabasePasswordSecretName();
  let dbPassword = process.env.DB_PASSWORD; // Fallback for local dev if secret name is not set

  if (dbPasswordSecretName) {
     try {
        // Assuming the secret value is the password string directly, not a JSON object.
        dbPassword = await secretsService.getSecret<string>(dbPasswordSecretName, { parseJson: false });
      } catch (error) {
        console.error(`Failed to retrieve database password from Secrets Manager (secret: ${dbPasswordSecretName}):`, error);
        // Depending on policy, might throw or fallback if local env var is allowed.
        // For now, if secret retrieval fails and DB_PASSWORD env var is not set, connection will fail.
        if (!dbPassword) {
            throw new Error(`Database password secret '${dbPasswordSecretName}' could not be retrieved and no DB_PASSWORD env var fallback.`);
        }
      }
  }


  const typeOrmLoggerLevelMapping: { [key: string]: LoggerOptions } = {
    debug: 'all',
    info: ['query', 'error', 'schema'],
    warn: ['warn', 'error'],
    error: ['error'],
  };
  const nodeEnv = coreConfigService.getNodeEnv();
  const appLogLevel = coreConfigService.getLogLevel();


  return {
    type: 'postgres',
    host: coreConfigService.getDatabaseHost(),
    port: coreConfigService.getDatabasePort(),
    username: coreConfigService.getDatabaseUsername(),
    password: dbPassword,
    database: coreConfigService.getDatabaseName(),
    entities: [entitiesPath],
    // entities: [__dirname + '/../../**/*.entity{.ts,.js}'], // Alternative path
    migrationsTableName: 'typeorm_migrations',
    migrations: [migrationsPath],
    // migrations: [__dirname + '/../../../migrations/*{.ts,.js}'],
    migrationsRun: nodeEnv === 'production', // Auto-run migrations in production
    synchronize: nodeEnv === 'development', // Auto-create schema in dev (false for prod)
    logging: typeOrmLoggerLevelMapping[appLogLevel] || ['error'], // Map app log level to TypeORM logging
    ssl: coreConfigService.getDatabaseSslEnabled()
      ? { rejectUnauthorized: true } // Basic SSL, for RDS typically true. Adjust if self-signed certs are used.
      : false,
    extra: {
      // e.g., connection pool settings
      max: coreConfigService.get('DB_CONNECTION_POOL_MAX') || 10, // Example custom config
    },
    keepConnectionAlive: true, // Useful for Lambda environments or long-running processes
  };
};
```