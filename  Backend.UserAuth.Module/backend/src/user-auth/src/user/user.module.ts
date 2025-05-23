import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserMfaSecretEntity } from './entities/user-mfa-secret.entity';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { UserActivityListener } from './listeners/user-activity.listener';

// Placeholder for UserAuthConfigModule and AuthModule
// @Module({}) class UserAuthConfigModule {} // Actual: ../config/user-auth-config.module
// @Module({}) class AuthModule {} // Actual: ../auth/auth.module

import { UserAuthConfigModule } from '../config/user-auth-config.module'; // Assuming this module will exist
import { AuthModule } from '../auth/auth.module'; // Assuming this module will exist


// Temporary placeholder entities until they are fully defined
// class UserEntity {}
// class RoleEntity {}
// class PermissionEntity {}
// class UserMfaSecretEntity {}


@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PermissionEntity,
      UserMfaSecretEntity,
    ]),
    UserAuthConfigModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserService,
    UserRepository,
    RoleRepository,
    PermissionRepository,
    UserActivityListener,
  ],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}