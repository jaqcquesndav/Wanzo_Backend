import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

export interface FinancialEvent {
  id: string;
  type: 'TRANSACTION' | 'RISK_ASSESSMENT' | 'FRAUD_ALERT' | 'PORTFOLIO_UPDATE' | 'CREDIT_EVENT';
  entityId: string;
  timestamp: Date;
  data: any;
  source: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Service de consommation d'événements Kafka pour l'analytics
 * Traite les événements financiers en temps réel pour l'analyse de risque
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly groupId = 'analytics-service';

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: this.configService.get<string[]>('kafka.brokers') || ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({ 
      groupId: this.groupId,
      heartbeatInterval: 3000,
      sessionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      
      // S'abonner aux topics d'événements financiers
      await this.consumer.subscribe({
        topics: [
          'financial.transactions',
          'financial.risk-events',
          'financial.fraud-alerts',
          'financial.portfolio-updates',
          'financial.credit-events',
          'financial.sme-events'
        ],
        fromBeginning: false
      });

      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.logger.log('Kafka consumer connecté et en écoute des événements financiers');
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation du consumer Kafka:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer déconnecté');
    } catch (error) {
      this.logger.error('Erreur lors de la déconnexion du consumer Kafka:', error);
    }
  }

  /**
   * Traite les messages Kafka reçus
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    try {
      const event = this.parseEvent(message.value?.toString());
      
      if (!event) {
        this.logger.warn(`Message invalide reçu du topic ${topic}`);
        return;
      }

      this.logger.log(`Événement reçu: ${event.type} - ${event.entityId} depuis ${topic}`);

      // Router l'événement selon son type
      switch (event.type) {
        case 'TRANSACTION':
          await this.handleTransactionEvent(event);
          break;
        case 'RISK_ASSESSMENT':
          await this.handleRiskAssessmentEvent(event);
          break;
        case 'FRAUD_ALERT':
          await this.handleFraudAlertEvent(event);
          break;
        case 'PORTFOLIO_UPDATE':
          await this.handlePortfolioUpdateEvent(event);
          break;
        case 'CREDIT_EVENT':
          await this.handleCreditEvent(event);
          break;
        default:
          this.logger.warn(`Type d'événement non supporté: ${event.type}`);
      }

    } catch (error) {
      this.logger.error(`Erreur lors du traitement du message du topic ${topic}:`, error);
    }
  }

  /**
   * Parse un message JSON en événement financier
   */
  private parseEvent(messageValue: string | undefined): FinancialEvent | null {
    if (!messageValue) return null;

    try {
      const parsed = JSON.parse(messageValue);
      return {
        id: parsed.id,
        type: parsed.type,
        entityId: parsed.entityId,
        timestamp: new Date(parsed.timestamp),
        data: parsed.data,
        source: parsed.source,
        severity: parsed.severity
      };
    } catch (error) {
      this.logger.error('Erreur lors du parsing du message:', error);
      return null;
    }
  }

  /**
   * Traite les événements de transaction
   */
  private async handleTransactionEvent(event: FinancialEvent): Promise<void> {
    try {
      const { entityId, data } = event;
      
      // Extraire les données de transaction
      const transaction = {
        id: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        smeId: entityId,
        type: data.transactionType,
        timestamp: event.timestamp
      };

      // Analyser la transaction pour des patterns de risque
      await this.analyzeTransaction(transaction);

      // Mettre à jour les métriques de risk en temps réel
      await this.updateRiskMetrics(entityId, transaction);

      this.logger.log(`Transaction analysée: ${transaction.id} - ${transaction.amount} ${transaction.currency}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement transaction:', error);
    }
  }

  /**
   * Traite les événements d'évaluation de risque
   */
  private async handleRiskAssessmentEvent(event: FinancialEvent): Promise<void> {
    try {
      const { entityId, data } = event;
      
      const riskAssessment = {
        entityId,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        factors: data.factors,
        timestamp: event.timestamp
      };

      // Stocker l'évaluation de risque
      await this.storeRiskAssessment(riskAssessment);

      // Déclencher des alertes si nécessaire
      if (riskAssessment.riskLevel === 'HIGH' || riskAssessment.riskLevel === 'CRITICAL') {
        await this.triggerRiskAlert(riskAssessment);
      }

      this.logger.log(`Évaluation de risque traitée: ${entityId} - Score: ${riskAssessment.riskScore}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement risk assessment:', error);
    }
  }

  /**
   * Traite les alertes de fraude
   */
  private async handleFraudAlertEvent(event: FinancialEvent): Promise<void> {
    try {
      const { entityId, data, severity } = event;
      
      const fraudAlert = {
        entityId,
        alertType: data.alertType,
        description: data.description,
        severity: severity || 'MEDIUM',
        evidence: data.evidence,
        timestamp: event.timestamp
      };

      // Stocker l'alerte de fraude
      await this.storeFraudAlert(fraudAlert);

      // Notifier les systèmes de surveillance
      await this.notifyFraudDetection(fraudAlert);

      this.logger.warn(`Alerte de fraude traitée: ${entityId} - ${fraudAlert.alertType} - Sévérité: ${fraudAlert.severity}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'alerte de fraude:', error);
    }
  }

  /**
   * Traite les mises à jour de portfolio
   */
  private async handlePortfolioUpdateEvent(event: FinancialEvent): Promise<void> {
    try {
      const { entityId, data } = event;
      
      const portfolioUpdate = {
        portfolioId: entityId,
        updateType: data.updateType,
        changes: data.changes,
        newValue: data.newValue,
        timestamp: event.timestamp
      };

      // Recalculer les métriques de portfolio
      await this.recalculatePortfolioMetrics(portfolioUpdate);

      // Mettre à jour les analyses de concentration
      await this.updateConcentrationAnalysis(portfolioUpdate);

      this.logger.log(`Mise à jour portfolio traitée: ${entityId} - ${portfolioUpdate.updateType}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la mise à jour portfolio:', error);
    }
  }

  /**
   * Traite les événements de crédit
   */
  private async handleCreditEvent(event: FinancialEvent): Promise<void> {
    try {
      const { entityId, data } = event;
      
      const creditEvent = {
        creditId: data.creditId,
        smeId: entityId,
        eventType: data.eventType, // 'APPLICATION', 'APPROVAL', 'DISBURSEMENT', 'PAYMENT', 'DEFAULT'
        amount: data.amount,
        currency: data.currency,
        timestamp: event.timestamp
      };

      // Mettre à jour l'historique de crédit
      await this.updateCreditHistory(creditEvent);

      // Recalculer les scores de risque crédit
      await this.recalculateCreditRisk(creditEvent);

      this.logger.log(`Événement crédit traité: ${creditEvent.creditId} - ${creditEvent.eventType}`);
    } catch (error) {
      this.logger.error('Erreur lors du traitement de l\'événement crédit:', error);
    }
  }

  // ========================
  // MÉTHODES D'ANALYSE
  // ========================

  private async analyzeTransaction(transaction: any): Promise<void> {
    // Logique d'analyse des transactions
    // - Détection de patterns anormaux
    // - Analyse de fréquence
    // - Vérification des seuils
    this.logger.debug(`Analyse transaction: ${transaction.id}`);
  }

  private async updateRiskMetrics(entityId: string, transaction: any): Promise<void> {
    // Mise à jour des métriques de risque en temps réel
    this.logger.debug(`Mise à jour métriques risque pour: ${entityId}`);
  }

  private async storeRiskAssessment(assessment: any): Promise<void> {
    // Stockage de l'évaluation de risque
    this.logger.debug(`Stockage évaluation risque: ${assessment.entityId}`);
  }

  private async triggerRiskAlert(assessment: any): Promise<void> {
    // Déclenchement d'alertes pour risque élevé
    this.logger.warn(`Alerte risque déclenchée: ${assessment.entityId} - Score: ${assessment.riskScore}`);
  }

  private async storeFraudAlert(alert: any): Promise<void> {
    // Stockage des alertes de fraude
    this.logger.debug(`Stockage alerte fraude: ${alert.entityId}`);
  }

  private async notifyFraudDetection(alert: any): Promise<void> {
    // Notification aux systèmes de détection de fraude
    this.logger.warn(`Notification fraude: ${alert.entityId} - ${alert.alertType}`);
  }

  private async recalculatePortfolioMetrics(update: any): Promise<void> {
    // Recalcul des métriques de portfolio
    this.logger.debug(`Recalcul métriques portfolio: ${update.portfolioId}`);
  }

  private async updateConcentrationAnalysis(update: any): Promise<void> {
    // Mise à jour de l'analyse de concentration
    this.logger.debug(`Mise à jour concentration: ${update.portfolioId}`);
  }

  private async updateCreditHistory(event: any): Promise<void> {
    // Mise à jour de l'historique de crédit
    this.logger.debug(`Mise à jour historique crédit: ${event.creditId}`);
  }

  private async recalculateCreditRisk(event: any): Promise<void> {
    // Recalcul du risque crédit
    this.logger.debug(`Recalcul risque crédit: ${event.creditId}`);
  }

  // ========================
  // MÉTHODES PUBLIQUES
  // ========================

  /**
   * Obtient les statistiques de consommation Kafka
   */
  getConsumerStats(): any {
    return {
      groupId: this.groupId,
      status: 'connected',
      topics: [
        'financial.transactions',
        'financial.risk-events', 
        'financial.fraud-alerts',
        'financial.portfolio-updates',
        'financial.credit-events',
        'financial.sme-events'
      ]
    };
  }

  /**
   * Teste la connexion Kafka
   */
  async testConnection(): Promise<boolean> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch (error) {
      this.logger.error('Test de connexion Kafka échoué:', error);
      return false;
    }
  }
}
