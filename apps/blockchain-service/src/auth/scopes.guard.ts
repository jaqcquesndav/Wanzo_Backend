import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from './scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    if (String(process.env.AUTH0_ENABLED || 'false') !== 'true') return true;
    const required = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    // Collect scopes from both "scope" (space-separated string) and "permissions" (array) claims.
    const scopeStr = String(req.user?.scope || '');
    const fromScope = scopeStr.split(' ').filter(Boolean);
    const fromPerms: string[] = Array.isArray(req.user?.permissions)
      ? req.user.permissions.filter((p: any) => typeof p === 'string')
      : [];
    const tokenScopes: string[] = Array.from(new Set([...fromScope, ...fromPerms]));

    // Optional: accept a super-scope that grants all (e.g., 'admin:full')
    const superScope = process.env.ADMIN_SUPER_SCOPE || 'admin:full';
    if (superScope && tokenScopes.includes(superScope)) return true;

    // Optional: bypass scope checks if enabled (useful for internal testing)
    if (String(process.env.AUTH0_SKIP_SCOPES || 'false') === 'true') return true;

    return required.every((s) => tokenScopes.includes(s));
  }
}
