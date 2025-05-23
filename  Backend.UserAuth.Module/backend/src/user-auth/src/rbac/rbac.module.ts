import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';

// Placeholder for UserModule and UserAuthConfigModule
// @Module({}) class UserModule {} // Actual: ../user/user.module
// @Module({}) class UserAuthConfigModule {} // Actual: ../config/user-auth-config.module

import { UserModule } from '../user/user.module'; // Assuming UserModule will be defined
import { UserAuthConfigModule } from '../config/user-auth-config.module'; // Assuming UserAuthConfigModule will be defined

@Module({
  imports: [
    UserModule, // For accessing UserRepository, RoleRepository, PermissionRepository
    UserAuthConfigModule,
  ],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}