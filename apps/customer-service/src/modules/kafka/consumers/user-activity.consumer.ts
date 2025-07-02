import { Injectable, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { UserService } from '../../users/services/user.service';

@Injectable()
export class UserActivityConsumer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    // S'abonner aux sujets Kafka
    this.kafkaClient.subscribeToResponseOf('user.activity');
    await this.kafkaClient.connect();
  }

  /**
   * Gestionnaire d'événements pour les activités utilisateurs
   * @param data - Données d'activité utilisateur
   */
  async handleUserActivity(data: any) {
    try {
      console.log('User activity event received:', data);
      
      // Vérifier si les données sont valides
      if (!data || !data.userId || !data.activityType) {
        console.error('Invalid user activity data received');
        return;
      }
      
      // Enregistrer l'activité utilisateur
      await this.userService.recordUserActivity({
        userId: data.userId,
        activityType: data.activityType,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: data.timestamp || new Date(),
      });
      
      console.log(`User activity recorded for user ${data.userId}`);
    } catch (error) {
      console.error('Error processing user activity event:', error);
    }
  }
}
