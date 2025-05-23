import { SetMetadata } from '@nestjs/common';
import { AuthConstants } from '../constants/auth.constants';

export const ROLES_KEY = AuthConstants.ROLES_KEY_METADATA;
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);