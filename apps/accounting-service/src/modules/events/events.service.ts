import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ACCOUNTING_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';
import { UserEventTopics } from '../../../../../packages/shared/events/kafka-config';

// Define the DataSharingConsentChangedEventData interface locally since it's not exported from kafka-config
interface DataSharingConsentChangedEventData {
  smeOrganizationId: string;
  institutionId: string;
  userId: string;
  consentGranted: boolean;
  timestamp: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(ACCOUNTING_KAFKA_PRODUCER_SERVICE)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client connected successfully for accounting-service producer.');
    } catch (error) {
      this.logger.error('Failed to connect Kafka client for accounting-service producer', error);
    }
  }

  async publishDataSharingConsentChanged(eventData: DataSharingConsentChangedEventData): Promise<void> {
    try {
      // Define the topic name as a constant since it's not in UserEventTopics
      const DATA_SHARING_CONSENT_CHANGED = 'user.data_sharing.consent.changed';
      
      this.logger.log(
        `Publishing ${DATA_SHARING_CONSENT_CHANGED} event: ${JSON.stringify(
          eventData,
        )}`,
      );
      await this.kafkaClient
        .emit(DATA_SHARING_CONSENT_CHANGED, JSON.stringify(eventData))
        .toPromise();
    } catch (error) {
      this.logger.error(
        `Failed to publish data sharing consent changed event for organization ${eventData.smeOrganizationId}`,
        error,
      );
      // Potentially throw the error or handle it as per application's error handling strategy
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }
}
