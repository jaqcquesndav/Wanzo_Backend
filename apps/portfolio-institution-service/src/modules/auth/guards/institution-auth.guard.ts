import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

/**
 * Guard qui s'assure qu'un utilisateur est associé à une institution valide
 * RÈGLE MÉTIER : Seuls les utilisateurs avec une institution créée depuis customer-service
 * peuvent accéder au service de portfolio
 */
@Injectable()
export class InstitutionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur a un institutionId
    if (!user.institutionId) {
      throw new UnauthorizedException(
        'Accès refusé : Utilisateur non associé à une institution. ' +
        'Veuillez compléter votre inscription via le service client.'
      );
    }

    try {
      // Vérifier que l'institution existe et est synchronisée
      const profileData = await this.authService.getUserProfileWithOrganization(user.id);
      
      if (!profileData.institution) {
        throw new UnauthorizedException(
          'Institution non trouvée ou en cours de synchronisation. ' +
          'Veuillez réessayer dans quelques instants.'
        );
      }

      // Ajouter les données d'institution à la request pour les contrôleurs
      request.institution = profileData.institution;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException(
        'Erreur lors de la vérification de l\'institution. ' +
        'Veuillez contacter le support.'
      );
    }
  }
}
