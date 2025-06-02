import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  constructor(@Inject('EVENTS_SERVICE') private readonly kafkaClient: ClientKafka) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client connected successfully for EventsService in auth-service.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error connecting Kafka client';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to connect Kafka client for EventsService in auth-service: ${errorMessage}`, errorStack);
    }
  }

  async onModuleDestroy() {
    try {
      await this.kafkaClient.close();
      this.logger.log('Kafka client closed successfully for EventsService in auth-service.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error closing Kafka client';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to close Kafka client for EventsService in auth-service: ${errorMessage}`, errorStack);
    }
  }

  // Méthodes de publication d'événements spécifiques à ajouter ici si nécessaire.
  // Exemple :
  // async publishUserLoggedInEvent(payload: { userId: string; timestamp: Date }) {
  //   try {
  //     const topic = 'user.logged.in'; // À définir dans UserEventTopics si cela devient un événement standard
  //     await this.kafkaClient.emit(topic, JSON.stringify(payload)).toPromise();
  //     this.logger.log(`Published event to ${topic}: ${JSON.stringify(payload)}`);
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Unknown error publishing event';
  //     const errorStack = error instanceof Error ? error.stack : undefined;
  //     this.logger.error(`Failed to publish event to user.logged.in: ${errorMessage}`, errorStack);
  //   }
  // }
}
