import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Can override handleRequest or canActivate if needed for custom logic
  // For example, to customize error messages or logging
}