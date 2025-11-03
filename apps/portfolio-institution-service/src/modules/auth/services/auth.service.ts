import { Injectable, Logger, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '../entities';
import { InstitutionService } from '../../institution/services/institution.service';
import { CustomerEventTopics, CustomerSyncRequestEvent } from '@wanzobe/shared/events/kafka-config';
import { ClientKafka } from '@nestjs/microservices';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from '../../events/kafka-client.module';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectRepository(AuthUser)
    private readonly userRepository: Repository<AuthUser>,
    private readonly institutionService: InstitutionService,
    @Inject(PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE) 
    private readonly kafkaClient: ClientKafka,
  ) {}

  async validateToken(token: string): Promise<Record<string, any>> {
    try {
      const authServiceUrl = this.configService.get('AUTH_SERVICE_URL');
      this.logger.debug(`Validating token with auth service: ${authServiceUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/oauth/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const user = response.data;
      
      // Vérifier que l'utilisateur a les scopes nécessaires
      const requiredScopes = ['admin:full', 'users:manage', 'settings:manage'];
      const userScopes = user.scope ? user.scope.split(' ') : [];
      
      if (!this.hasRequiredScopes(userScopes, requiredScopes)) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      this.logger.debug(`Token validated successfully for user: ${user.sub}`);
      return user;
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => userScopes.includes(scope));
  }

  hasPermission(user: any, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Récupère le profil utilisateur avec les informations de son institution
   * RÈGLE MÉTIER : Un utilisateur DOIT avoir une institution créée depuis customer-service
   */
  async getUserProfileWithOrganization(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }

    // VALIDATION CRITIQUE : Un utilisateur DOIT avoir un institutionId
    if (!user.institutionId) {
      this.logger.error(`Utilisateur ${userId} sans institutionId - Accès refusé`);
      throw new UnauthorizedException(
        'Accès refusé : Utilisateur non associé à une institution. ' +
        'Veuillez compléter votre inscription via le service client.'
      );
    }

    let institution: any = null;
    
    try {
      // Rechercher l'institution dans la base locale
      institution = await this.institutionService.findById(user.institutionId);
      
      if (!institution) {
        this.logger.warn(`Institution ${user.institutionId} non trouvée localement - Synchronisation requise`);
        
        // Déclencher synchronisation OBLIGATOIRE depuis customer-service
        await this.requestInstitutionSyncFromCustomerService(user.institutionId);
        
        // Rejeter temporairement l'accès en attendant la synchronisation
        throw new UnauthorizedException(
          'Institution en cours de synchronisation. Veuillez réessayer dans quelques instants.'
        );
      }
      
      this.logger.log(`Institution trouvée pour l'utilisateur ${userId}: ${institution.name}`);
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-lancer les erreurs d'autorisation
      }
      
      this.logger.error(`Erreur lors de la récupération de l'institution ${user.institutionId}:`, error);
      throw new UnauthorizedException(
        'Erreur lors de la vérification de l\'institution. Veuillez contacter le support.'
      );
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        institutionId: user.institutionId,
        auth0Id: user.auth0Id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      institution: {
        id: institution.id,
        kiotaId: institution.kiotaId,
        name: institution.name,
        type: institution.type,
        licenseType: institution.licenseType,
        regulatoryStatus: institution.regulatoryStatus,
        address: institution.address,
        country: institution.country,
        phone: institution.phone,
        email: institution.email,
        website: institution.website,
        status: institution.status,
        active: institution.active,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt
      }
    };
  }

  /**
   * Demande la synchronisation d'une institution depuis le customer service via Kafka
   */
  private async requestInstitutionSyncFromCustomerService(institutionId: string): Promise<void> {
    try {
      const syncEvent: CustomerSyncRequestEvent = {
        customerId: institutionId,
        requestId: `portfolio_institution_${institutionId}_${Date.now()}`,
        requestedBy: 'portfolio_institution_service',
        timestamp: new Date().toISOString()
      };
      
      // Utiliser Kafka client pour émettre l'événement
      this.kafkaClient.emit(CustomerEventTopics.CUSTOMER_SYNC_REQUEST, syncEvent);
      this.logger.log(`Événement de synchronisation customer émis pour l'institution ${institutionId}`);
      
    } catch (error) {
      this.logger.error(`Erreur lors de la demande de synchronisation pour l'institution ${institutionId}:`, error);
    }
  }
}
