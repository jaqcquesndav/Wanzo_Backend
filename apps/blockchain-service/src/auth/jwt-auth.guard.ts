import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (String(process.env.AUTH0_ENABLED || 'false') !== 'true') return true;
    return super.canActivate(context) as any;
  }
}
