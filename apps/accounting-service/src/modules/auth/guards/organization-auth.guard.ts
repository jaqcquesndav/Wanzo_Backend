import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

/**
 * Guard qui s'assure qu'un utilisateur est associé à une organisation valide
 * RÈGLE MÉTIER : Seuls les utilisateurs avec une organisation créée depuis customer-service
 * peuvent accéder aux autres services (accounting, portfolio, gestion commerciale, etc.)
 */
@Injectable()
export class OrganizationAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur a un organizationId
    if (!user.organizationId) {
      throw new UnauthorizedException(
        'Accès refusé : Utilisateur non associé à une organisation. ' +
        'Veuillez compléter votre inscription via le service client.'
      );
    }

    try {
      // Vérifier que l'organisation existe et est synchronisée
      const profileData = await this.authService.getUserProfileWithOrganization(user.id);
      
      if (!profileData.organization) {
        throw new UnauthorizedException(
          'Organisation non trouvée ou en cours de synchronisation. ' +
          'Veuillez réessayer dans quelques instants.'
        );
      }

      // Ajouter les données d'organisation à la request pour les contrôleurs
      request.organization = profileData.organization;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException(
        'Erreur lors de la vérification de l\'organisation. ' +
        'Veuillez contacter le support.'
      );
    }
  }
}
