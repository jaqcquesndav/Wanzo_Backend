import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GatewayAuthGuard wraps the JWT AuthGuard but allows bypass for specific public paths
 * such as third-party webhooks/callbacks.
 */
@Injectable()
export class GatewayAuthGuard extends AuthGuard('jwt') {
  // Public paths that should NOT require JWT auth (exact prefix match)
  private readonly publicPrefixes: string[] = [
    '/payments/serdipay/callback',
  ];

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const path: string = req.path || '';
    if (this.publicPrefixes.some((p) => path.startsWith(p))) {
      return true;
    }
    return super.canActivate(context);
  }
}
