import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserAuthConfigService } from '../../config/user-auth.config';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserEntity } from '../../user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userAuthConfigService: UserAuthConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: userAuthConfigService.getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    // The payload 'sub' is the userId
    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    // Attach more payload data to the user object if needed, or return a custom object
    // For now, we return the user entity. The payload itself is also often attached to request.user by Passport.
    // We can augment the user object with data from the payload if it's not already on the entity
    // For example, isMfaAuthenticated status from the token can be crucial for subsequent MfaGuard checks.
    (user as any).isMfaAuthenticated = payload.isMfaAuthenticated;
    (user as any).rolesFromToken = payload.roles; // Keep roles from token for guard, might differ from DB if recently changed and token not refreshed
    return user;
  }
}