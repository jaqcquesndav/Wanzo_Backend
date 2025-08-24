import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

/**
 * Guard qui s'assure qu'un utilisateur est associé à une entreprise valide
 * RÈGLE MÉTIER : Seuls les utilisateurs avec une entreprise créée depuis customer-service
 * peuvent accéder au service de gestion commerciale
 */
@Injectable()
export class CompanyAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur a un companyId
    if (!user.companyId) {
      throw new UnauthorizedException(
        'Accès refusé : Utilisateur non associé à une entreprise. ' +
        'Veuillez compléter votre inscription via le service client.'
      );
    }

    try {
      // Vérifier que l'entreprise existe et est synchronisée
      const profileData = await this.authService.getUserProfileWithOrganization(user.id);
      
      if (!profileData.company) {
        throw new UnauthorizedException(
          'Entreprise non trouvée ou en cours de synchronisation. ' +
          'Veuillez réessayer dans quelques instants.'
        );
      }

      // Ajouter les données d'entreprise à la request pour les contrôleurs
      request.company = profileData.company;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException(
        'Erreur lors de la vérification de l\'entreprise. ' +
        'Veuillez contacter le support.'
      );
    }
  }
}
