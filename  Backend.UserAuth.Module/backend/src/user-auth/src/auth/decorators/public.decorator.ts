import { SetMetadata } from '@nestjs/common';
import { AuthConstants } from '../constants/auth.constants';

export const IS_PUBLIC_KEY = AuthConstants.IS_PUBLIC_KEY_METADATA;
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);