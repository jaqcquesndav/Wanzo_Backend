import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ACCOUNTING_KAFKA_PRODUCER_SERVICE } from './events.module';
import { UserEventTopics, DataSharingConsentChangedEventData } from '../../../../../packages/shared/events/kafka-config';

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
      this.logger.log(
        `Publishing ${UserEventTopics.DATA_SHARING_CONSENT_CHANGED} event: ${JSON.stringify(
          eventData,
        )}`,
      );
      await this.kafkaClient
        .emit(UserEventTopics.DATA_SHARING_CONSENT_CHANGED, JSON.stringify(eventData))
        .toPromise();
    } catch (error) {
      this.logger.error(
        `Failed to publish ${UserEventTopics.DATA_SHARING_CONSENT_CHANGED} event for organization ${eventData.smeOrganizationId}`,
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
