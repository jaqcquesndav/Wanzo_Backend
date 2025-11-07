import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';
import { MessageVersionManager } from '@wanzobe/shared/events/message-versioning';
import { kafkaMonitoring } from '@wanzobe/shared/monitoring';

export interface SyncUserData {
  auth0Id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  companyId?: string;
  userType?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  /**
   * Synchronise un nouvel utilisateur avec le Customer Service
   */
  async syncUserWithCustomerService(userData: SyncUserData): Promise<void> {
    try {
      this.logger.log(`Synchronisation de l'utilisateur ${userData.auth0Id} avec Customer Service`);
      
      const syncEvent = {
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        picture: userData.picture,
        companyId: userData.companyId,
        userType: userData.userType,
        metadata: {
          ...userData.metadata,
          source: 'admin-service',
          syncedAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      // Créer message standardisé et l'émettre
      const standardMessage = MessageVersionManager.createStandardMessage(
        StandardKafkaTopics.USER_SYNC_REQUEST,
        syncEvent,
        'admin-service'
      );
      
      this.kafkaClient.emit(StandardKafkaTopics.USER_SYNC_REQUEST, standardMessage);
      this.logger.log(`Événement de synchronisation émis pour l'utilisateur ${userData.auth0Id}`);
      
    } catch (error) {
      this.logger.error(`Erreur lors de la synchronisation de l'utilisateur ${userData.auth0Id}:`, error);
      throw error;
    }
  }

  /**
   * Notifie le Customer Service qu'un utilisateur existant s'est connecté
   */
  async notifyUserLogin(userData: SyncUserData): Promise<void> {
    try {
      this.logger.debug(`Notification de connexion pour l'utilisateur ${userData.auth0Id}`);
      
      const loginEvent = {
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        companyId: userData.companyId,
        userType: userData.userType,
        metadata: {
          ...userData.metadata,
          source: 'admin-service',
          loginAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      // Créer message standardisé et l'émettre
      const standardMessage = MessageVersionManager.createStandardMessage(
        StandardKafkaTopics.USER_LOGIN_NOTIFICATION,
        loginEvent,
        'admin-service'
      );
      
      this.kafkaClient.emit(StandardKafkaTopics.USER_LOGIN_NOTIFICATION, standardMessage);
      this.logger.debug(`Notification de connexion émise pour l'utilisateur ${userData.auth0Id}`);
      
    } catch (error) {
      this.logger.warn(`Erreur lors de la notification de connexion pour ${userData.auth0Id}:`, error);
      // Ne pas lancer d'erreur pour ne pas bloquer le login
    }
  }
}
