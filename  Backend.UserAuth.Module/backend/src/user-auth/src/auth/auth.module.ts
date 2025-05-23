import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
// CognitoStrategy will be imported if CognitoModule is actively used.
// import { CognitoStrategy } from './cognito/cognito.strategy';

// Placeholder for UserAuthConfigModule, MfaModule, PasswordModule, SessionModule, CognitoModule, UserModule
// These modules would be defined in their respective directories.
// For now, to make this file syntactically valid with respect to the imports in the SDS,
// we list them here. In a real scenario, these would be actual module imports.
// e.g. import { UserModule } from '../user/user.module';

// --- Start Placeholder Modules (Remove when actual modules are created) ---
// @Module({}) class UserModule {} // Actual: ../user/user.module
@Module({}) class UserAuthConfigModule {}
// @Module({}) class MfaModule {} // Actual: ./mfa/mfa.module
// @Module({}) class PasswordModule {} // Actual: ./password/password.module
// @Module({}) class SessionModule {} // Actual: ./session/session.module
// @Module({}) class CognitoModule {} // Actual: ./cognito/cognito.module
// --- End Placeholder Modules ---

import UserAuthConfig, { USER_AUTH_CONFIG_NAMESPACE } from '../config/user-auth.config';
import { UserModule } from '../user/user.module'; // Assuming UserModule will be defined
import { MfaModule } from './mfa/mfa.module'; // Assuming MfaModule will be defined
import { PasswordModule } from './password/password.module'; // Assuming PasswordModule will be defined
import { SessionModule } from './session/session.module'; // Assuming SessionModule will be defined
import { CognitoModule } from './cognito/cognito.module'; // Assuming CognitoModule will be defined, can be optional
// Placeholder CognitoStrategy until CognitoModule is fully defined
class CognitoStrategy {}


@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [UserAuthConfigModule], // This should be the actual ConfigModule for UserAuth
      useFactory: async (configService: ConfigType<typeof UserAuthConfig>) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      }),
      inject: [USER_AUTH_CONFIG_NAMESPACE], // Inject the specific config namespace
    }),
    UserAuthConfigModule, // Provides UserAuthConfigService and validated config
    forwardRef(() => MfaModule),
    forwardRef(() => PasswordModule),
    forwardRef(() => SessionModule),
    CognitoModule, // Optional: include if Cognito integration is active
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    // CognitoStrategy, // Provide if Cognito integration is active
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtModule, // Export JwtModule for other modules to use (e.g., for custom JWT signing/verification if needed)
    MfaModule,
    PasswordModule,
    SessionModule,
  ],
})
export class AuthModule {}