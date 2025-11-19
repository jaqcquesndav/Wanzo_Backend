import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ACCOUNTING_KAFKA_PRODUCER_SERVICE } from './kafka-producer.module';
import { UserEventTopics, UserCreatedEvent } from '@wanzobe/shared/events/kafka-config';

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

  async publishUserCreated(eventData: UserCreatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Publishing ${UserEventTopics.USER_CREATED} event: ${JSON.stringify(eventData)}`,
      );
      await this.kafkaClient
        .emit(UserEventTopics.USER_CREATED, JSON.stringify(eventData))
        .toPromise();
    } catch (error) {
      this.logger.error(
        `Failed to publish user created event for user ${eventData.userId}`,
        error,
      );
      throw error;
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

  async publishCompanyFinancialDataShared(eventData: {
    companyId: string;
    companyName: string;
    consentGrantedTo: string[];
    accountingStandard?: string; // SYSCOHADA ou IFRS
    financialData: {
      totalRevenue: number;
      netProfit: number;
      totalAssets: number;
      totalLiabilities: number;
      cashFlow: number;
      creditScore: number;
      financialRating: string;
    };
    treasuryAccounts?: Array<{
      accountCode: string;
      accountName: string;
      balance: number;
      currency: string;
      bankName?: string;
      accountNumber?: string;
    }>;
    treasuryTimeseries?: {
      weekly: any[];
      monthly: any[];
      quarterly: any[];
      annual: any[];
    };
    timestamp: string;
  }): Promise<void> {
    try {
      const COMPANY_FINANCIAL_DATA_SHARED = 'company.financial.data.shared';
      
      this.logger.log(
        `Publishing ${COMPANY_FINANCIAL_DATA_SHARED} event for company ${eventData.companyId} with treasury data`
      );
      await this.kafkaClient
        .emit(COMPANY_FINANCIAL_DATA_SHARED, JSON.stringify(eventData))
        .toPromise();
    } catch (error) {
      this.logger.error(
        `Failed to publish financial data shared event for company ${eventData.companyId}`,
        error,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }
}
