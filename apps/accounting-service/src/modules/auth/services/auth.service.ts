import { Injectable, Logger, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { OrganizationService } from '../../organization/services/organization.service';
import { ClientKafka } from '@nestjs/microservices';
import { OrganizationEventTopics, OrganizationSyncRequestEvent } from '@wanzobe/shared/events/kafka-config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private jwtService: JwtService,
    private readonly organizationService: OrganizationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId }
    });
    return user;
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { auth0Id }
    });
  }
  
  async validateToken(token: string): Promise<any> {
    try {
      // Vérifier si le token est dans la liste noire
      const blacklistedToken = await this.tokenBlacklistRepository.findOne({
        where: { token }
      });
      
      if (blacklistedToken) {
        this.logger.warn('Tentative d\'utilisation d\'un token révoqué');
        return { isValid: false, error: 'Token révoqué' };
      }

      // Vérifier la validité du token avec Auth0
      const jwksUri = `${this.configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`;
      const audience = this.configService.get('AUTH0_AUDIENCE');
      const issuer = `${this.configService.get('AUTH0_DOMAIN')}/`;
      
      const payload = this.jwtService.verify(token, {
        secret: jwksUri,
        audience,
        issuer
      });

      const auth0Id = payload.sub;
      let user = await this.getUserByAuth0Id(auth0Id);
      
      if (!user) {
        this.logger.warn(`L'utilisateur avec Auth0 ID ${auth0Id} n'a pas été trouvé`);
        return { isValid: false, error: 'Utilisateur non trouvé' };
      }

      return {
        isValid: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          organizationId: user.organizationId
        }
      };
    } catch (error) {
      this.logger.error('Erreur lors de la validation du token', error);
      return { isValid: false, error: 'Token invalide' };
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      organizationId: user.organizationId,
      permissions: user.permissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Récupère le profil utilisateur avec les informations de son organisation
   * RÈGLE MÉTIER : Un utilisateur DOIT avoir une organization créée depuis customer-service
   */
  async getUserProfileWithOrganization(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }

    // VALIDATION CRITIQUE : Un utilisateur DOIT avoir un organizationId
    if (!user.organizationId) {
      this.logger.error(`Utilisateur ${userId} sans organizationId - Accès refusé`);
      throw new UnauthorizedException(
        'Accès refusé : Utilisateur non associé à une organisation. ' +
        'Veuillez compléter votre inscription via le service client.'
      );
    }

    let organization: any = null;
    
    try {
      // Rechercher l'organisation dans la base locale
      organization = await this.organizationService.findById(user.organizationId);
      
      if (!organization) {
        this.logger.warn(`Organisation ${user.organizationId} non trouvée localement - Synchronisation requise`);
        
        // Déclencher synchronisation OBLIGATOIRE depuis customer-service
        await this.requestOrganizationSyncFromCustomerService(user.organizationId);
        
        // Rejeter temporairement l'accès en attendant la synchronisation
        throw new UnauthorizedException(
          'Organisation en cours de synchronisation. Veuillez réessayer dans quelques instants.'
        );
      }
      
      this.logger.log(`Organisation trouvée pour l'utilisateur ${userId}: ${organization.name}`);
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-lancer les erreurs d'autorisation
      }
      
      this.logger.error(`Erreur lors de la récupération de l'organisation ${user.organizationId}:`, error);
      throw new UnauthorizedException(
        'Erreur lors de la vérification de l\'organisation. Veuillez contacter le support.'
      );
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        organizationId: user.organizationId,
        permissions: user.permissions || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      organization: {
        id: organization.id,
        name: organization.name,
        registrationNumber: organization.registrationNumber,
        taxId: organization.taxId,
        vatNumber: organization.vatNumber,
        address: organization.address,
        city: organization.city,
        country: organization.country,
        phone: organization.phone,
        email: organization.email,
        currency: organization.currency,
        accountingMode: organization.accountingMode,
        fiscalYearStart: organization.fiscalYearStart,
        fiscalYearEnd: organization.fiscalYearEnd,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt
      }
    };
  }

  /**
   * Demande la synchronisation d'une organisation depuis le customer service via Kafka
   */
  private async requestOrganizationSyncFromCustomerService(organizationId: string): Promise<void> {
    try {
      this.logger.log(`Demande de synchronisation pour l'organisation ${organizationId}`);
      
      const syncEvent: OrganizationSyncRequestEvent = {
        organizationId: organizationId,
        requestedBy: 'accounting-service',
        requestId: `sync-${Date.now()}-${organizationId}`,
        timestamp: new Date().toISOString()
      };
      
      this.kafkaClient.emit(OrganizationEventTopics.ORGANIZATION_SYNC_REQUEST, syncEvent);
      this.logger.log(`Événement de synchronisation émis pour l'organisation ${organizationId}`);
      
    } catch (error) {
      this.logger.error(`Erreur lors de la demande de synchronisation pour l'organisation ${organizationId}:`, error);
    }
  }

  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    
    // Mettre à jour uniquement les champs autorisés
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
    if (updateData.language) user.language = updateData.language;
    if (updateData.timezone) user.timezone = updateData.timezone;
    if (updateData.preferences) user.preferences = updateData.preferences;
    
    await this.userRepository.save(user);
    
    return this.getUserProfile(userId);
  }

  async invalidateSession(token: string): Promise<void> {
    // Ajouter le token à la liste noire
    const blacklistEntry = this.tokenBlacklistRepository.create({
      token,
      invalidatedAt: new Date()
    });
    
    await this.tokenBlacklistRepository.save(blacklistEntry);
    this.logger.log(`Token invalidé avec succès`);
  }
}
