import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // It's good practice to connect the client when the module initializes
    // However, for a producer, sending a message will often auto-connect if not already connected.
    // For a consumer, explicit connection is more critical.
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client connected successfully.');
    } catch (error) {
      this.logger.error('Failed to connect Kafka client:', error);
    }
  }

  async onModuleDestroy() {
    // Ensure the Kafka client is closed when the application shuts down
    try {
      await this.kafkaClient.close();
      this.logger.log('Kafka client closed successfully.');
    } catch (error) {
      this.logger.error('Failed to close Kafka client:', error);
    }
  }

  async sendMessage(topic: string, message: any): Promise<any> {
    this.logger.log(`Sending message to Kafka topic: ${topic}`);
    try {
      // The send method returns an Observable, you might want to convert it to a Promise
      // depending on how you want to handle the response (e.g., await its completion).
      const result = await this.kafkaClient.emit(topic, message).toPromise();
      this.logger.log(`Message sent to topic ${topic}, result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send message to Kafka topic ${topic}:`, error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Envoie une confirmation de traitement d'écriture comptable
   * 
   * @param journalEntryId ID de l'écriture traitée
   * @param sourceId ID de la source (opération commerciale, etc.)
   * @param success Statut de succès du traitement
   * @param message Message optionnel (raison d'échec, etc.)
   */
  async sendJournalEntryProcessingStatus(
    journalEntryId: string,
    sourceId: string,
    success: boolean,
    message?: string,
  ): Promise<void> {
    const statusMessage = {
      journalEntryId,
      sourceId,
      success,
      message,
      timestamp: new Date().toISOString(),
      processedBy: 'accounting-service',
    };
    
    await this.sendMessage('accounting.journal.status', statusMessage);
  }

  // Example of sending a message and waiting for a response (Request-Reply pattern)
  // This requires the consumer to be set up to send a response back.
  // async sendMessageWithResponse<TResponse = any, TRequest = any>(
  //   topic: string,
  //   payload: TRequest,
  // ): Promise<TResponse> {
  //   this.logger.log(`Sending message with response to Kafka topic: ${topic}`);
  //   try {
  //     return this.kafkaClient.send<TResponse, TRequest>(topic, payload).toPromise();
  //   } catch (error) {
  //     this.logger.error(`Failed to send message with response to Kafka topic ${topic}:`, error);
  //     throw error;
  //   }
  // }
}
