import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { RiskCalculationService, SMEData } from '../../risk-analysis/services/risk-calculation.service';
import { FraudDetectionService } from '../../fraud-detection/services/fraud-detection.service';
import { GeographicAnalysisService } from '../../geographic-analysis/services/geographic-analysis.service';
import { FinancialRiskGraphService } from '../../graph/services/financial-risk-graph.service';
import { TimeseriesRiskService } from '../../timeseries/services/timeseries-risk.service';

export interface TransactionEvent {
  id: string;
  type: 'TRANSACTION_CREATED' | 'TRANSACTION_UPDATED' | 'TRANSACTION_CANCELLED';
  timestamp: string;
  data: {
    transactionId: string;
    entityId: string;
    entityType: 'SME' | 'CUSTOMER' | 'INSTITUTION';
    amount: number;
    currency: string;
    paymentMethod: string;
    location?: {
      province: string;
      city: string;
    };
    counterpart?: {
      id: string;
      name: string;
      type: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface CreditEvent {
  id: string;
  type: 'CREDIT_APPLICATION' | 'CREDIT_APPROVED' | 'CREDIT_DISBURSED' | 'PAYMENT_MADE' | 'DEFAULT_DETECTED';
  timestamp: string;
  data: {
    creditId: string;
    smeId: string;
    institutionId: string;
    amount: number;
    interestRate: number;
    term: number;
    status: string;
    guarantees?: Array<{
      type: string;
      value: number;
    }>;
    riskFactors?: Record<string, any>;
  };
}

export interface AccountingEvent {
  id: string;
  type: 'JOURNAL_ENTRY' | 'BALANCE_UPDATE' | 'FINANCIAL_STATEMENT';
  timestamp: string;
  data: {
    entityId: string;
    entityType: string;
    accounts: Array<{
      accountCode: string;
      accountName: string;
      debit?: number;
      credit?: number;
      balance: number;
    }>;
    period: string;
    metadata?: Record<string, any>;
  };
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();

  constructor(
    private configService: ConfigService,
    private riskCalculationService: RiskCalculationService,
    private fraudDetectionService: FraudDetectionService,
    private geographicAnalysisService: GeographicAnalysisService
  ) {
    // Configuration Kafka
    this.kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: this.configService.get<string[]>('KAFKA_BROKERS', ['localhost:9092']),
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing Kafka consumers...');
    
    try {
      await this.setupConsumers();
      this.logger.log('Kafka consumers initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka consumers:', error);
      // Ne pas faire échouer le démarrage si Kafka n'est pas disponible
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Kafka consumers...');
    
    try {
      await this.disconnectAllConsumers();
      this.logger.log('Kafka consumers shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down Kafka consumers:', error);
    }
  }

  private async setupConsumers() {
    // Consumer pour les événements de transaction
    await this.createConsumer(
      'transaction-events',
      'analytics-transactions-group',
      this.handleTransactionEvent.bind(this)
    );

    // Consumer pour les événements de crédit
    await this.createConsumer(
      'credit-events',
      'analytics-credits-group',
      this.handleCreditEvent.bind(this)
    );

    // Consumer pour les événements comptables
    await this.createConsumer(
      'accounting-events',
      'analytics-accounting-group',
      this.handleAccountingEvent.bind(this)
    );

    // Consumer pour les événements de portfolio
    await this.createConsumer(
      'portfolio-events',
      'analytics-portfolio-group',
      this.handlePortfolioEvent.bind(this)
    );
  }

  private async createConsumer(
    topic: string,
    groupId: string,
    messageHandler: (message: KafkaMessage) => Promise<void>
  ) {
    try {
      const consumer = this.kafka.consumer({ groupId });
      
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            this.logger.debug(`Received message from ${topic}:${partition}`);
            await messageHandler(message);
          } catch (error) {
            this.logger.error(`Error processing message from ${topic}:`, error);
            // Ici on pourrait implémenter une logique de retry ou dead letter queue
          }
        },
      });

      this.consumers.set(topic, consumer);
      this.logger.log(`Consumer created for topic: ${topic}`);

    } catch (error) {
      this.logger.error(`Failed to create consumer for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Traitement des événements de transaction
   */
  private async handleTransactionEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event: TransactionEvent = JSON.parse(message.value.toString());
      this.logger.debug(`Processing transaction event: ${event.type} for ${event.data.transactionId}`);

      switch (event.type) {
        case 'TRANSACTION_CREATED':
        case 'TRANSACTION_UPDATED':
          await this.processTransactionForRiskAnalysis(event);
          await this.processTransactionForFraudDetection(event);
          break;

        case 'TRANSACTION_CANCELLED':
          await this.processTransactionCancellation(event);
          break;

        default:
          this.logger.warn(`Unknown transaction event type: ${event.type}`);
      }

    } catch (error) {
      this.logger.error('Error handling transaction event:', error);
      throw error;
    }
  }

  /**
   * Traitement des événements de crédit
   */
  private async handleCreditEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event: CreditEvent = JSON.parse(message.value.toString());
      this.logger.debug(`Processing credit event: ${event.type} for ${event.data.creditId}`);

      switch (event.type) {
        case 'CREDIT_APPLICATION':
          await this.processCreditApplication(event);
          break;

        case 'CREDIT_APPROVED':
        case 'CREDIT_DISBURSED':
          await this.processCreditActivation(event);
          break;

        case 'PAYMENT_MADE':
          await this.processCreditPayment(event);
          break;

        case 'DEFAULT_DETECTED':
          await this.processCreditDefault(event);
          break;

        default:
          this.logger.warn(`Unknown credit event type: ${event.type}`);
      }

    } catch (error) {
      this.logger.error('Error handling credit event:', error);
      throw error;
    }
  }

  /**
   * Traitement des événements comptables
   */
  private async handleAccountingEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event: AccountingEvent = JSON.parse(message.value.toString());
      this.logger.debug(`Processing accounting event: ${event.type} for ${event.data.entityId}`);

      switch (event.type) {
        case 'JOURNAL_ENTRY':
          await this.processJournalEntry(event);
          break;

        case 'BALANCE_UPDATE':
          await this.processBalanceUpdate(event);
          break;

        case 'FINANCIAL_STATEMENT':
          await this.processFinancialStatement(event);
          break;

        default:
          this.logger.warn(`Unknown accounting event type: ${event.type}`);
      }

    } catch (error) {
      this.logger.error('Error handling accounting event:', error);
      throw error;
    }
  }

  /**
   * Traitement des événements de portfolio
   */
  private async handlePortfolioEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      this.logger.debug(`Processing portfolio event: ${event.type}`);

      // Traitement des événements de portfolio (à définir selon les besoins)
      await this.processPortfolioUpdate(event);

    } catch (error) {
      this.logger.error('Error handling portfolio event:', error);
      throw error;
    }
  }

  // Méthodes de traitement spécifiques

  private async processTransactionForRiskAnalysis(event: TransactionEvent): Promise<void> {
    try {
      // Recalcul du risque pour l'entité concernée
      if (event.data.entityType === 'SME') {
        const smeData = this.extractSMEDataFromTransaction(event);
        await this.riskCalculationService.calculateSMERisk(event.data.entityId, smeData);
        this.logger.debug(`Risk recalculated for SME: ${event.data.entityId}`);
      }

      // Mise à jour des métriques géographiques si localisation disponible
      if (event.data.location) {
        // Déclencher une mise à jour des métriques géographiques
        this.logger.debug(`Geographic metrics update triggered for ${event.data.location.province}`);
      }

    } catch (error) {
      this.logger.error('Error processing transaction for risk analysis:', error);
    }
  }

  private async processTransactionForFraudDetection(event: TransactionEvent): Promise<void> {
    try {
      // Conversion de l'événement en format pour analyse de fraude
      const transactionData = {
        id: event.data.transactionId,
        entityId: event.data.entityId,
        entityType: event.data.entityType,
        amount: event.data.amount,
        timestamp: new Date(event.timestamp), // Convert string to Date
        paymentMethod: event.data.paymentMethod,
        location: event.data.location,
        counterpart: event.data.counterpart
      };

      // Analyse de fraude en temps réel
      const fraudAlerts = await this.fraudDetectionService.analyzeTransaction(transactionData);
      
      if (fraudAlerts.length > 0) {
        this.logger.warn(`Fraud alerts generated for transaction ${event.data.transactionId}: ${fraudAlerts.length} alerts`);
      }

    } catch (error) {
      this.logger.error('Error processing transaction for fraud detection:', error);
    }
  }

  private async processTransactionCancellation(event: TransactionEvent): Promise<void> {
    try {
      // Traitement spécifique des annulations (potentiellement suspicieux)
      this.logger.debug(`Transaction cancelled: ${event.data.transactionId}`);
      
      // Pourrait déclencher une analyse de pattern d'annulation
      
    } catch (error) {
      this.logger.error('Error processing transaction cancellation:', error);
    }
  }

  private async processCreditApplication(event: CreditEvent): Promise<void> {
    try {
      // Évaluation du risque pour nouvelle demande de crédit
      const smeData = this.extractSMEDataFromCredit(event);
      await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
      
      this.logger.debug(`Risk assessment completed for credit application: ${event.data.creditId}`);

    } catch (error) {
      this.logger.error('Error processing credit application:', error);
    }
  }

  private async processCreditActivation(event: CreditEvent): Promise<void> {
    try {
      // Mise à jour du profil de risque suite à activation de crédit
      const smeData = this.extractSMEDataFromCredit(event);
      await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
      
      this.logger.debug(`Risk profile updated for credit activation: ${event.data.creditId}`);

    } catch (error) {
      this.logger.error('Error processing credit activation:', error);
    }
  }

  private async processCreditPayment(event: CreditEvent): Promise<void> {
    try {
      // Mise à jour du comportement de paiement
      const smeData = this.extractSMEDataFromCredit(event);
      await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
      
      this.logger.debug(`Payment behavior updated for credit: ${event.data.creditId}`);

    } catch (error) {
      this.logger.error('Error processing credit payment:', error);
    }
  }

  private async processCreditDefault(event: CreditEvent): Promise<void> {
    try {
      // Traitement spécial pour les défauts
      const smeData = this.extractSMEDataFromCredit(event);
      await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
      
      // Possibilité de déclencher des alertes spéciales
      this.logger.warn(`Default detected for credit: ${event.data.creditId}, SME: ${event.data.smeId}`);

    } catch (error) {
      this.logger.error('Error processing credit default:', error);
    }
  }

  private async processJournalEntry(event: AccountingEvent): Promise<void> {
    try {
      // Mise à jour des métriques financières
      if (event.data.entityType === 'SME') {
        const smeData = this.extractSMEDataFromAccounting(event);
        await this.riskCalculationService.calculateSMERisk(event.data.entityId, smeData);
      }
      
      this.logger.debug(`Financial metrics updated from journal entry for: ${event.data.entityId}`);

    } catch (error) {
      this.logger.error('Error processing journal entry:', error);
    }
  }

  private async processBalanceUpdate(event: AccountingEvent): Promise<void> {
    try {
      // Traitement des mises à jour de solde
      if (event.data.entityType === 'SME') {
        const smeData = this.extractSMEDataFromAccounting(event);
        await this.riskCalculationService.calculateSMERisk(event.data.entityId, smeData);
      }

    } catch (error) {
      this.logger.error('Error processing balance update:', error);
    }
  }

  private async processFinancialStatement(event: AccountingEvent): Promise<void> {
    try {
      // Traitement des états financiers
      if (event.data.entityType === 'SME') {
        const smeData = this.extractSMEDataFromAccounting(event);
        await this.riskCalculationService.calculateSMERisk(event.data.entityId, smeData);
      }

    } catch (error) {
      this.logger.error('Error processing financial statement:', error);
    }
  }

  private async processPortfolioUpdate(event: any): Promise<void> {
    try {
      // Traitement des mises à jour de portfolio
      this.logger.debug(`Portfolio update processed: ${event.type}`);
      
      // Ici on pourrait recalculer les métriques de risque de portfolio
      
    } catch (error) {
      this.logger.error('Error processing portfolio update:', error);
    }
  }

  // Méthodes utilitaires

  private async disconnectAllConsumers(): Promise<void> {
    const disconnectPromises = Array.from(this.consumers.values()).map(async (consumer) => {
      try {
        await consumer.disconnect();
      } catch (error) {
        this.logger.error('Error disconnecting consumer:', error);
      }
    });

    await Promise.all(disconnectPromises);
    this.consumers.clear();
  }

  /**
   * Méthode pour redémarrer un consumer spécifique
   */
  async restartConsumer(topic: string): Promise<void> {
    try {
      const consumer = this.consumers.get(topic);
      if (consumer) {
        await consumer.disconnect();
        this.consumers.delete(topic);
      }

      // Recréer le consumer selon le topic
      // Ici on pourrait avoir une logique plus sophistiquée
      this.logger.log(`Consumer restarted for topic: ${topic}`);

    } catch (error) {
      this.logger.error(`Error restarting consumer for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Health check pour les consumers Kafka
   */
  getConsumerStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [topic] of this.consumers.entries()) {
      // Ici on pourrait vérifier l'état réel du consumer
      status[topic] = true; // Simplification
    }

    return status;
  }

  /**
   * Helper method to extract SME data from transaction events
   */
  private extractSMEDataFromTransaction(event: TransactionEvent): SMEData {
    return {
      id: event.data.entityId,
      location: event.data.location ? {
        province: event.data.location.province,
        city: event.data.location.city
      } : undefined,
      business: {
        sector: 'UNKNOWN', // Default sector as we don't have this in transaction events
        yearsInBusiness: 1, // Default value
        employeeCount: 1, // Default value
        monthlyRevenue: event.data.amount || 0
      }
    };
  }

  /**
   * Helper method to extract SME data from credit events
   */
  private extractSMEDataFromCredit(event: CreditEvent): SMEData {
    return {
      id: event.data.smeId,
      business: {
        sector: 'UNKNOWN', // Default sector
        yearsInBusiness: 1, // Default value
        employeeCount: 1, // Default value
        monthlyRevenue: event.data.amount || 0
      },
      history: {
        payments: [],
        creditHistory: [{
          amount: event.data.amount,
          status: event.data.status,
          performance: event.type === 'DEFAULT_DETECTED' ? 'poor' : 'good'
        }]
      }
    };
  }

  /**
   * Helper method to extract SME data from accounting events
   */
  private extractSMEDataFromAccounting(event: AccountingEvent): SMEData {
    const accounting = {
      currentAssets: 0,
      currentLiabilities: 0,
      totalAssets: 0,
      totalDebt: 0,
      netIncome: 0,
      revenue: 0,
      operatingIncome: 0
    };

    // Extract accounting data from the event
    event.data.accounts.forEach(account => {
      if (account.accountName.toLowerCase().includes('asset')) {
        accounting.totalAssets += account.balance;
        if (account.accountName.toLowerCase().includes('current')) {
          accounting.currentAssets += account.balance;
        }
      } else if (account.accountName.toLowerCase().includes('liability')) {
        accounting.totalDebt += account.balance;
        if (account.accountName.toLowerCase().includes('current')) {
          accounting.currentLiabilities += account.balance;
        }
      } else if (account.accountName.toLowerCase().includes('revenue')) {
        accounting.revenue += account.balance;
      } else if (account.accountName.toLowerCase().includes('income')) {
        accounting.netIncome += account.balance;
      }
    });

    return {
      id: event.data.entityId,
      accounting,
      business: {
        sector: 'UNKNOWN',
        yearsInBusiness: 1,
        employeeCount: 1,
        monthlyRevenue: accounting.revenue / 12
      }
    };
  }
}
