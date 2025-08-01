import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Intercepteur qui ajoute les informations du client au contexte de la requête
 * et journalise les performances des requêtes
 */
@Injectable()
export class BusinessContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BusinessContextInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const now = Date.now();
    
    // Stocker le contexte d'entreprise pour une utilisation ultérieure
    request.businessContext = {
      // ID de l'entreprise dans la gestion commerciale (pas forcément le même que platformClientId)
      businessUnitId: user?.businessUnitId,
      // ID du client sur la plateforme pour la validation des abonnements
      platformClientId: user?.platformClientId,
      userRole: user?.role,
      userId: user?.id,
    };
    
    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        // Journaliser les requêtes qui prennent plus de 1 seconde
        if (delay > 1000) {
          this.logger.warn(
            `Requête lente: ${request.method} ${request.url} - ${delay}ms`
          );
        }
      }),
    );
  }
}
