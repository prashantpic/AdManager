import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../user/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserEntity; // Assuming user is populated by JwtAuthGuard/JwtStrategy

    return data ? user?.[data] : user;
  },
);