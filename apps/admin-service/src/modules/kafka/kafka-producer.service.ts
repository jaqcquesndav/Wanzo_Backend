import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(
    @Inject('KAFKA_PRODUCER_SERVICE') private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to Kafka for producing messages.');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka for producing messages.', error);
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('Kafka producer client disconnected.');
  }

  async sendMessage<T = any>(topic: string, message: T): Promise<void> {
    try {
      this.logger.log(`Sending message to topic ${topic}: ${JSON.stringify(message).substring(0,100)}...`);
      // Using firstValueFrom to await the send operation if needed, though send() is often fire-and-forget.
      // For critical messages, ensure your Kafka setup provides delivery guarantees.
      await firstValueFrom(this.client.emit(topic, message)); 
      this.logger.log(`Message successfully sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}`, error);
      // Depending on the criticality, you might want to implement retry logic or dead-letter queueing.
      throw error; // Re-throw to allow upstream services to handle it
    }
  }

  // Example of a more specific send method
  async sendAdminEvent<T = any>(topic: string, eventPayload: T) {
    // You can add common headers or transformations here if needed
    const message = {
      source: 'admin-service',
      timestamp: new Date().toISOString(),
      payload: eventPayload,
    };
    await this.sendMessage(topic, message);
  }
}
