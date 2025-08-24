import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur pour récupérer l'institution de l'utilisateur connecté
 * À utiliser avec InstitutionAuthGuard
 */
export const CurrentInstitution = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.institution;
  },
);
