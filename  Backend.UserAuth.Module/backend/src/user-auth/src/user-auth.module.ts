import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { UserAuthConfigModule } from './config/user-auth.config'; // Path based on SDS for UserAuthConfigModule

@Module({
  imports: [
    UserAuthConfigModule, // Should be configured early
    AuthModule,
    UserModule,
    RbacModule,
    AuditModule,
  ],
  exports: [AuthModule, UserModule, RbacModule],
})
export class UserAuthModule {}