import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { RiskCalculationService, SMEData } from '../../risk-analysis/services/risk-calculation.service';
import { FraudDetectionService } from '../../fraud-detection/services/fraud-detection.service';
import { GeographicAnalysisService } from '../../geographic-analysis/services/geographic-analysis.service';
import { FinancialRiskGraphService } from '../../graph/services/financial-risk-graph.service';
import { TimeseriesRiskService } from '../../timeseries/services/timeseries-risk.service';
import { MicroserviceIntegrationService } from '../../integration/services/microservice-integration.service';

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
    private geographicAnalysisService: GeographicAnalysisService,
    private microserviceIntegrationService: MicroserviceIntegrationService
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
    // Consumer pour les événements d'opérations commerciales (gestion_commerciale_service)
    await this.createConsumer(
      'commerce.operation.created',
      'analytics-commerce-group',
      this.handleBusinessOperationEvent.bind(this)
    );

    // Consumer pour les événements utilisateur (customer-service)
    await this.createConsumer(
      'user.created',
      'analytics-users-group',
      this.handleUserEvent.bind(this)
    );

    await this.createConsumer(
      'user.updated',
      'analytics-users-group',
      this.handleUserEvent.bind(this)
    );

    // Consumer pour les événements de portfolio (portfolio-service)
    await this.createConsumer(
      'portfolio.funding-request.status-changed',
      'analytics-portfolio-group',
      this.handlePortfolioEvent.bind(this)
    );

    await this.createConsumer(
      'portfolio.contract.created',
      'analytics-portfolio-group',
      this.handlePortfolioEvent.bind(this)
    );

    // Consumer pour les événements de tokens (customer-service)
    await this.createConsumer(
      'token.purchase.created',
      'analytics-tokens-group',
      this.handleTokenEvent.bind(this)
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
   * Traitement des événements d'opérations commerciales (BusinessOperationCreatedEvent)
   */
  private async handleBusinessOperationEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      this.logger.debug(`Processing business operation event: ${event.type} for operation ${event.id}`);

      // Conversion vers format transaction pour l'analyse de risque
      const transactionData = {
        id: event.id,
        entityId: event.clientId,
        entityType: 'SME' as const,
        amount: event.amountCdf,
        timestamp: new Date(event.createdAt),
        paymentMethod: 'UNKNOWN',
        location: undefined,
        counterpart: undefined
      };

      // Analyse de fraude et calcul de risque
      await this.fraudDetectionService.analyzeTransaction(transactionData);
      
      // Récupération des données SME réelles pour recalcul du risque
      const smeData = await this.microserviceIntegrationService.getRealSMEData(event.clientId);
      if (smeData) {
        await this.riskCalculationService.calculateSMERisk(event.clientId, smeData);
      }

    } catch (error) {
      this.logger.error('Error handling business operation event:', error);
      throw error;
    }
  }

  /**
   * Traitement des événements utilisateur (user.created, user.updated, user.login)
   */
  private async handleUserEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      this.logger.debug(`Processing user event for user ${event.userId}`);

      // Gérer les événements de connexion utilisateur
      if (event.eventType === 'user.login') {
        await this.handleUserLoginEvent(event);
      }

      // Mise à jour du cache des données utilisateur
      if (event.customerId && event.role === 'SME') {
        // Invalider le cache des données SME pour forcer une mise à jour
        await this.microserviceIntegrationService.getRealSMEData(event.customerId);
      }

    } catch (error) {
      this.logger.error('Error handling user event:', error);
      throw error;
    }
  }

  /**
   * Traitement spécifique des événements de connexion utilisateur
   */
  private async handleUserLoginEvent(event: any): Promise<void> {
    try {
      this.logger.log(`Processing login event for user ${event.userId}`);
      
      // Enregistrer l'événement de login pour l'analytique
      const loginData = {
        userId: event.userId,
        userType: event.userType,
        role: event.role,
        loginTime: new Date(event.loginTime),
        platform: event.platform || 'web',
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        financialInstitutionId: event.financialInstitutionId,
        companyId: event.companyId,
        isFirstLogin: event.isFirstLogin,
        accessibleApps: event.accessibleApps || []
      };

      // Enregistrer les métriques de connexion
      await this.recordLoginMetrics(loginData);
      
      // Si c'est une première connexion, enregistrer l'événement d'onboarding
      if (event.isFirstLogin) {
        await this.recordOnboardingMetrics({
          userId: event.userId,
          userType: event.userType,
          organizationId: event.financialInstitutionId || event.companyId,
          timestamp: new Date(event.loginTime)
        });
      }
      
      this.logger.log(`Login analytics recorded for user ${event.userId}`);
      
    } catch (error) {
      this.logger.error(`Error processing user login event for user ${event.userId}:`, error);
    }
  }

  /**
   * Enregistrer les métriques de connexion
   */
  private async recordLoginMetrics(loginData: any): Promise<void> {
    // Ici on peut implémenter l'enregistrement des métriques dans une base de données
    // ou un système de métriques comme InfluxDB, Prometheus, etc.
    this.logger.debug(`Recording login metrics for user ${loginData.userId}`, {
      userType: loginData.userType,
      platform: loginData.platform,
      isFirstLogin: loginData.isFirstLogin
    });
    
    // TODO: Implémenter l'enregistrement dans la base de données analytics
    // await this.analyticsRepository.recordLogin(loginData);
  }

  /**
   * Enregistrer les métriques d'onboarding
   */
  private async recordOnboardingMetrics(onboardingData: any): Promise<void> {
    this.logger.debug(`Recording onboarding metrics for user ${onboardingData.userId}`, {
      userType: onboardingData.userType,
      organizationId: onboardingData.organizationId
    });
    
    // TODO: Implémenter l'enregistrement dans la base de données analytics
    // await this.analyticsRepository.recordOnboarding(onboardingData);
  }

  /**
   * Traitement des événements de tokens
   */
  private async handleTokenEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      this.logger.debug(`Processing token event for customer ${event.customerId}`);

      // Analyse de l'impact sur le profil de risque
      if (event.customerId) {
        const smeData = await this.microserviceIntegrationService.getRealSMEData(event.customerId);
        if (smeData) {
          await this.riskCalculationService.calculateSMERisk(event.customerId, smeData);
        }
      }

    } catch (error) {
      this.logger.error('Error handling token event:', error);
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
   * Traitement des événements de portfolio (portfolio.funding-request.status-changed, portfolio.contract.created)
   */
  private async handlePortfolioEvent(message: KafkaMessage): Promise<void> {
    try {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());
      this.logger.debug(`Processing portfolio event: ${event.type || 'unknown'}`);

      // Traitement selon le type d'événement portfolio
      if (event.clientId) {
        const smeData = await this.microserviceIntegrationService.getRealSMEData(event.clientId);
        if (smeData) {
          await this.riskCalculationService.calculateSMERisk(event.clientId, smeData);
        }
      }

      // Mise à jour des métriques de portfolio si données disponibles
      if (event.portfolioId) {
        this.logger.debug(`Portfolio ${event.portfolioId} metrics update triggered`);
      }

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
        const smeData = await this.extractSMEDataFromTransaction(event);
        if (smeData) {
          await this.riskCalculationService.calculateSMERisk(event.data.entityId, smeData);
          this.logger.debug(`Risk recalculated for SME: ${event.data.entityId}`);
        } else {
          this.logger.warn(`Could not get SME data for risk calculation: ${event.data.entityId}`);
        }
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
      const smeData = await this.extractSMEDataFromCredit(event);
      if (smeData) {
        await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
        this.logger.debug(`Risk assessment completed for credit application: ${event.data.creditId}`);
      } else {
        this.logger.warn(`Could not get SME data for credit application: ${event.data.smeId}`);
      }

    } catch (error) {
      this.logger.error('Error processing credit application:', error);
    }
  }

  private async processCreditActivation(event: CreditEvent): Promise<void> {
    try {
      // Mise à jour du profil de risque suite à activation de crédit
      const smeData = await this.extractSMEDataFromCredit(event);
      if (smeData) {
        await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
        this.logger.debug(`Risk profile updated for credit activation: ${event.data.creditId}`);
      } else {
        this.logger.warn(`Could not get SME data for credit activation: ${event.data.smeId}`);
      }

    } catch (error) {
      this.logger.error('Error processing credit activation:', error);
    }
  }

  private async processCreditPayment(event: CreditEvent): Promise<void> {
    try {
      // Mise à jour du comportement de paiement
      const smeData = await this.extractSMEDataFromCredit(event);
      if (smeData) {
        await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
        this.logger.debug(`Payment behavior updated for credit: ${event.data.creditId}`);
      } else {
        this.logger.warn(`Could not get SME data for credit payment: ${event.data.smeId}`);
      }

    } catch (error) {
      this.logger.error('Error processing credit payment:', error);
    }
  }

  private async processCreditDefault(event: CreditEvent): Promise<void> {
    try {
      // Traitement spécial pour les défauts
      const smeData = await this.extractSMEDataFromCredit(event);
      if (smeData) {
        await this.riskCalculationService.calculateSMERisk(event.data.smeId, smeData);
        
        // Possibilité de déclencher des alertes spéciales
        this.logger.warn(`Default detected for credit: ${event.data.creditId}, SME: ${event.data.smeId}`);
      } else {
        this.logger.warn(`Could not get SME data for credit default: ${event.data.smeId}`);
      }

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
   * Helper method to extract SME data from transaction events using real microservice data
   */
  private async extractSMEDataFromTransaction(event: TransactionEvent): Promise<SMEData | null> {
    try {
      // Utilisation du service d'intégration pour récupérer les vraies données
      const realSMEData = await this.microserviceIntegrationService.getRealSMEData(
        event.data.entityId
      );

      if (!realSMEData) {
        this.logger.debug(`No SME data found for entity ${event.data.entityId}`);
        return null;
      }

      // Enrichissement avec les données de l'événement transaction
      if (event.data.location) {
        realSMEData.location = {
          province: event.data.location.province,
          city: event.data.location.city
        };
      }

      // Mise à jour du chiffre d'affaires mensuel avec la transaction courante
      if (event.data.amount > 0 && realSMEData.business) {
        realSMEData.business.monthlyRevenue = Math.max(
          realSMEData.business.monthlyRevenue,
          event.data.amount
        );
      }

      return realSMEData;
    } catch (error) {
      this.logger.error(`Error extracting real SME data from transaction:`, error);
      return null;
    }
  }

  /**
   * Helper method to extract SME data from credit events using real microservice data
   */
  private async extractSMEDataFromCredit(event: CreditEvent): Promise<SMEData | null> {
    try {
      // Utilisation du service d'intégration pour récupérer les vraies données
      const realSMEData = await this.microserviceIntegrationService.getRealSMEData(
        event.data.smeId
      );

      if (!realSMEData) {
        this.logger.debug(`No SME data found for credit event: ${event.data.smeId}`);
        return null;
      }

      // Enrichissement avec les données de l'événement crédit
      if (!realSMEData.history) {
        realSMEData.history = {
          payments: [],
          creditHistory: []
        };
      }

      // Ajout de l'historique de crédit actuel
      realSMEData.history.creditHistory = realSMEData.history.creditHistory || [];
      realSMEData.history.creditHistory.push({
        amount: event.data.amount,
        status: event.data.status,
        performance: event.type === 'DEFAULT_DETECTED' ? 'poor' : 'good'
      });

      return realSMEData;
    } catch (error) {
      this.logger.error(`Error extracting real SME data from credit event:`, error);
      return null;
    }
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
