import { Injectable, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { TokenService } from '../../tokens/services/token.service';

@Injectable()
export class TokenUsageConsumer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly tokenService: TokenService,
  ) {}

  async onModuleInit() {
    // S'abonner aux sujets Kafka
    this.kafkaClient.subscribeToResponseOf('token.usage');
    await this.kafkaClient.connect();
  }

  /**
   * Gestionnaire d'événements pour la consommation des tokens
   * @param data - Données de consommation des tokens
   */
  async handleTokenUsage(data: any) {
    try {
      console.log('Token usage event received:', data);
      
      // Vérifier si les données sont valides
      if (!data || !data.customerId || !data.amount || !data.serviceType) {
        console.error('Invalid token usage data received');
        return;
      }
      
      // Enregistrer l'utilisation des tokens
      await this.tokenService.recordTokenUsage({
        customerId: data.customerId,
        userId: data.userId,
        amount: data.amount,
        serviceType: data.serviceType,
        requestId: data.requestId,
        context: data.context,
        metadata: data.metadata,
      });
      
      console.log(`Token usage recorded for customer ${data.customerId}`);
    } catch (error) {
      console.error('Error processing token usage event:', error);
    }
  }
}
