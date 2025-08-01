import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Garde qui vérifie que l'utilisateur a accès aux données d'une entreprise/unité commerciale spécifique
 * Cela permet de s'assurer que les utilisateurs ne peuvent accéder qu'aux données
 * de l'entreprise à laquelle ils appartiennent
 */
@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    
    // Si la route ne contient pas de paramètre companyId, pas besoin de vérifier
    if (!params.companyId) {
      return true;
    }
    
    // Vérifier que l'utilisateur appartient à cette entreprise
    if (user.businessUnitId === params.companyId) {
      return true;
    }
    
    // Pour les administrateurs du client sur la plateforme, ils peuvent accéder
    // à toutes les unités commerciales de leur organisation
    if (user.role === 'CUSTOMER_ADMIN' || user.role === 'ADMIN') {
      // TODO: Implémenter une vérification que cette unité commerciale
      // appartient bien au client de la plateforme
      return true;
    }
    
    throw new ForbiddenException(
      'Vous n\'avez pas accès aux données de cette entreprise'
    );
  }
}
