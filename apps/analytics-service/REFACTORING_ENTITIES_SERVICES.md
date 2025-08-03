# REFACTORING DÉTAILLÉ - NOUVELLES ENTITÉS ET SERVICES

## 🏗️ NOUVELLES ENTITÉS À CRÉER

### 1. ENTITÉS DE RISQUE (TypeORM + PostgreSQL)

```typescript
// src/modules/risk-analysis/entities/risk-profile.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum RiskLevel {
  VERY_LOW = 'very_low',    // 0-2
  LOW = 'low',              // 2-4
  MEDIUM = 'medium',        // 4-6
  HIGH = 'high',            // 6-8
  VERY_HIGH = 'very_high'   // 8-10
}

export enum EntityType {
  SME = 'sme',
  INSTITUTION = 'institution', 
  PORTFOLIO = 'portfolio',
  CREDIT = 'credit',
  SECTOR = 'sector',
  PROVINCE = 'province'
}

@Entity('risk_profiles')
@Index(['entityType', 'entityId'])
@Index(['riskLevel', 'updatedAt'])
export class RiskProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: EntityType
  })
  entityType!: EntityType;

  @Column('uuid')
  entityId!: string;

  @Column('decimal', { precision: 4, scale: 2 })
  riskScore!: number; // 0.00 - 10.00

  @Column({
    type: 'enum',
    enum: RiskLevel
  })
  riskLevel!: RiskLevel;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  defaultProbability?: number; // Probabilité de défaut (0-1)

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  recoveryRate?: number; // Taux de recouvrement estimé

  @Column('jsonb', { nullable: true })
  riskFactors?: {
    financial: number;      // Score financier
    operational: number;    // Score opérationnel  
    market: number;        // Score marché
    geographic: number;    // Score géographique
    behavioral: number;    // Score comportemental
  };

  @Column('jsonb', { nullable: true })
  calculations?: {
    model: string;
    version: string;
    confidence: number;
    lastCalculation: Date;
    dataPoints: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

```typescript
// src/modules/fraud-detection/entities/fraud-alert.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum FraudType {
  UNUSUAL_TRANSACTION = 'unusual_transaction',
  IDENTITY_FRAUD = 'identity_fraud',
  MONEY_LAUNDERING = 'money_laundering',
  COLLUSION = 'collusion',
  DOCUMENT_FRAUD = 'document_fraud',
  PAYMENT_FRAUD = 'payment_fraud'
}

export enum AlertStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
  RESOLVED = 'resolved'
}

@Entity('fraud_alerts')
@Index(['fraudType', 'status'])
@Index(['entityId', 'createdAt'])
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  entityId!: string;

  @Column()
  entityType!: string;

  @Column({
    type: 'enum',
    enum: FraudType
  })
  fraudType!: FraudType;

  @Column('decimal', { precision: 4, scale: 3 })
  riskScore!: number; // 0.000 - 1.000

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status!: AlertStatus;

  @Column('text')
  description!: string;

  @Column('jsonb')
  evidence!: {
    indicators: string[];
    suspiciousPatterns: any[];
    relatedEntities: string[];
    confidence: number;
  };

  @Column('jsonb', { nullable: true })
  investigation?: {
    assignedTo: string;
    startDate: Date;
    findings: string[];
    actions: string[];
  };

  @Column({ nullable: true })
  province?: string;

  @Column({ nullable: true })
  sector?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2. ENTITÉS GÉOGRAPHIQUES

```typescript
// src/modules/geographic-analysis/entities/geographic-entity.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum GeographicLevel {
  COUNTRY = 'country',
  PROVINCE = 'province', 
  CITY = 'city',
  COMMUNE = 'commune'
}

@Entity('geographic_entities')
@Index(['level', 'parentId'])
@Index(['code'])
export class GeographicEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // CD, KIN, GOMBE, etc.

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: GeographicLevel
  })
  level!: GeographicLevel;

  @Column('uuid', { nullable: true })
  parentId?: string;

  @Column('jsonb', { nullable: true })
  coordinates?: {
    latitude: number;
    longitude: number;
    bounds?: {
      north: number;
      south: number; 
      east: number;
      west: number;
    };
  };

  @Column('jsonb', { nullable: true })
  demographics?: {
    population: number;
    economicActivity: string[];
    mainSectors: string[];
  };

  @Column('jsonb', { nullable: true })
  riskMetrics?: {
    overallRisk: number;
    economicStability: number;
    infrastructureQuality: number;
    businessEnvironment: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 3. ENTITÉS SECTORIELLES

```typescript
// src/modules/sector-analysis/entities/business-sector.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('business_sectors')
@Index(['code'])
export class BusinessSector {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // AGR, MIN, COM, etc.

  @Column()
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  riskCharacteristics?: {
    volatility: number;        // Volatilité du secteur
    cyclicality: number;       // Caractère cyclique
    regulatoryRisk: number;    // Risque réglementaire
    competitionLevel: number;  // Niveau de concurrence
    barrierToEntry: number;    // Barrière à l'entrée
  };

  @Column('jsonb', { nullable: true })
  marketData?: {
    totalSMEs: number;
    totalCredits: number;
    averageCreditSize: number;
    defaultRate: number;
    growthRate: number;
  };

  @Column('jsonb', { nullable: true })
  benchmarks?: {
    profitabilityRatio: number;
    liquidityRatio: number;
    leverageRatio: number;
    efficiencyRatio: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 4. ENTITÉ DE SURVEILLANCE SYSTÉMIQUE

```typescript
// src/modules/systemic-risk/entities/systemic-risk-indicator.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SystemicRiskType {
  CONCENTRATION = 'concentration',     // Concentration sectorielle/géographique
  CORRELATION = 'correlation',         // Corrélations de défaut
  CONTAGION = 'contagion',            // Risque de contagion
  LIQUIDITY = 'liquidity',            // Risque de liquidité systémique
  CREDIT_CYCLE = 'credit_cycle'       // Cycle de crédit
}

@Entity('systemic_risk_indicators')
export class SystemicRiskIndicator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: SystemicRiskType
  })
  riskType!: SystemicRiskType;

  @Column()
  indicatorName!: string;

  @Column('decimal', { precision: 6, scale: 4 })
  currentValue!: number;

  @Column('decimal', { precision: 6, scale: 4 })
  threshold!: number;

  @Column('decimal', { precision: 6, scale: 4, nullable: true })
  historicalAverage?: number;

  @Column('jsonb')
  calculation!: {
    formula: string;
    parameters: Record<string, any>;
    dataPoints: number;
    period: string;
  };

  @Column('jsonb', { nullable: true })
  breakdown?: {
    byProvince?: Record<string, number>;
    bySector?: Record<string, number>;
    byInstitution?: Record<string, number>;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

## 🔧 NOUVEAUX SERVICES À CRÉER

### 1. SERVICE DE CALCUL DES RISQUES

```typescript
// src/modules/risk-analysis/services/risk-calculation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskProfile, EntityType, RiskLevel } from '../entities/risk-profile.entity';

@Injectable()
export class RiskCalculationService {
  private readonly logger = new Logger(RiskCalculationService.name);

  constructor(
    @InjectRepository(RiskProfile)
    private riskProfileRepository: Repository<RiskProfile>
  ) {}

  async calculateSMERisk(smeId: string, smeData: any): Promise<number> {
    // Algorithme de calcul du risque PME
    const factors = {
      financial: await this.calculateFinancialRisk(smeData.accounting),
      operational: await this.calculateOperationalRisk(smeData.business),
      market: await this.calculateMarketRisk(smeData.sector, smeData.location),
      geographic: await this.calculateGeographicRisk(smeData.location),
      behavioral: await this.calculateBehavioralRisk(smeData.history)
    };

    // Pondération des facteurs
    const weights = {
      financial: 0.35,
      operational: 0.25,
      market: 0.20,
      geographic: 0.15,
      behavioral: 0.05
    };

    const riskScore = Object.keys(factors).reduce((sum, key) => {
      return sum + (factors[key] * weights[key]);
    }, 0);

    return Math.min(Math.max(riskScore, 0), 10); // Borné entre 0 et 10
  }

  async calculatePortfolioRisk(portfolioId: string): Promise<number> {
    // Calcul du risque d'un portefeuille
    // Agrégation des risques individuels + corrélations
  }

  async calculateSystemicRisk(): Promise<number> {
    // Calcul du risque systémique global
    // Concentration + corrélations + facteurs macro
  }

  private async calculateFinancialRisk(accountingData: any): Promise<number> {
    // Ratios financiers: liquidité, solvabilité, rentabilité
    const liquidityRatio = accountingData.currentAssets / accountingData.currentLiabilities;
    const debtRatio = accountingData.totalDebt / accountingData.totalAssets;
    const profitabilityRatio = accountingData.netIncome / accountingData.revenue;

    // Scoring basé sur les benchmarks sectoriels
    let score = 5; // Score neutre de base

    if (liquidityRatio < 1.2) score += 2;
    else if (liquidityRatio > 2.0) score -= 1;

    if (debtRatio > 0.7) score += 2;
    else if (debtRatio < 0.3) score -= 1;

    if (profitabilityRatio < 0.05) score += 2;
    else if (profitabilityRatio > 0.15) score -= 1;

    return Math.min(Math.max(score, 0), 10);
  }

  private async calculateGeographicRisk(location: any): Promise<number> {
    // Risque basé sur la localisation
    const provinceRiskMap = {
      'Kinshasa': 3.0,
      'Katanga': 6.5,
      'Nord-Kivu': 8.5,
      'Sud-Kivu': 8.0,
      'Bas-Congo': 4.5
    };

    return provinceRiskMap[location.province] || 5.0;
  }

  private async calculateBehavioralRisk(history: any): Promise<number> {
    // Historique de paiement et comportement
    if (!history.payments || history.payments.length === 0) return 7.0;

    const onTimeRate = history.payments.filter(p => p.onTime).length / history.payments.length;
    const avgDelay = history.payments.reduce((sum, p) => sum + (p.delayDays || 0), 0) / history.payments.length;

    let score = 5;
    
    if (onTimeRate > 0.95) score -= 2;
    else if (onTimeRate < 0.8) score += 3;

    if (avgDelay > 30) score += 2;
    else if (avgDelay < 5) score -= 1;

    return Math.min(Math.max(score, 0), 10);
  }
}
```

### 2. SERVICE DE DÉTECTION DE FRAUDE

```typescript
// src/modules/fraud-detection/services/fraud-detection.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraudAlert, FraudType } from '../entities/fraud-alert.entity';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private fraudAlertRepository: Repository<FraudAlert>
  ) {}

  async analyzeTransaction(transaction: any): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];

    // 1. Détection de montants anormaux
    const amountAnomaly = await this.detectAmountAnomaly(transaction);
    if (amountAnomaly.isAnomalous) {
      alerts.push(await this.createAlert(
        transaction.entityId,
        'transaction',
        FraudType.UNUSUAL_TRANSACTION,
        amountAnomaly.score,
        'Transaction amount significantly deviates from historical pattern',
        amountAnomaly.evidence
      ));
    }

    // 2. Détection de patterns temporels suspects
    const timePatternAnomaly = await this.detectTimePatternAnomaly(transaction);
    if (timePatternAnomaly.isAnomalous) {
      alerts.push(await this.createAlert(
        transaction.entityId,
        'transaction',
        FraudType.UNUSUAL_TRANSACTION,
        timePatternAnomaly.score,
        'Unusual timing pattern detected',
        timePatternAnomaly.evidence
      ));
    }

    // 3. Détection de réseaux suspects
    const networkAnomaly = await this.detectNetworkAnomaly(transaction);
    if (networkAnomaly.isAnomalous) {
      alerts.push(await this.createAlert(
        transaction.entityId,
        'network',
        FraudType.COLLUSION,
        networkAnomaly.score,
        'Suspicious network activity detected',
        networkAnomaly.evidence
      ));
    }

    return alerts;
  }

  private async detectAmountAnomaly(transaction: any): Promise<any> {
    // Algorithme de détection d'anomalies de montant
    // Utilise l'écart-type et les percentiles historiques
    
    const historicalAmounts = await this.getHistoricalAmounts(transaction.entityId);
    
    if (historicalAmounts.length < 10) {
      return { isAnomalous: false, score: 0 };
    }

    const mean = historicalAmounts.reduce((sum, amt) => sum + amt, 0) / historicalAmounts.length;
    const variance = historicalAmounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / historicalAmounts.length;
    const stdDev = Math.sqrt(variance);

    const zScore = Math.abs((transaction.amount - mean) / stdDev);
    
    // Score de 0 à 1 basé sur le z-score
    const anomalyScore = Math.min(zScore / 3, 1); // Normalisation
    
    return {
      isAnomalous: zScore > 2.5, // Plus de 2.5 écarts-types
      score: anomalyScore,
      evidence: {
        zScore,
        historicalMean: mean,
        historicalStdDev: stdDev,
        currentAmount: transaction.amount
      }
    };
  }

  private async detectNetworkAnomaly(transaction: any): Promise<any> {
    // Détection de réseaux de blanchiment ou de collusion
    // Analyse des connexions entre entités
    
    // Utilise Neo4j pour analyser les patterns de réseau
    const networkQuery = `
      MATCH (source)-[r:TRANSACTED_WITH]->(target)
      WHERE source.id = $entityId
      WITH target, count(r) as transactionCount, sum(r.amount) as totalAmount
      WHERE transactionCount > 10 AND totalAmount > $threshold
      RETURN target, transactionCount, totalAmount
    `;

    // Implémentation de l'analyse de réseau...
    
    return { isAnomalous: false, score: 0 };
  }

  private async createAlert(
    entityId: string,
    entityType: string,
    fraudType: FraudType,
    score: number,
    description: string,
    evidence: any
  ): Promise<FraudAlert> {
    const alert = new FraudAlert();
    alert.entityId = entityId;
    alert.entityType = entityType;
    alert.fraudType = fraudType;
    alert.riskScore = score;
    alert.description = description;
    alert.evidence = evidence;

    return this.fraudAlertRepository.save(alert);
  }
}
```

### 3. SERVICE D'ANALYSE GÉOGRAPHIQUE

```typescript
// src/modules/geographic-analysis/services/geographic-analysis.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeographicEntity } from '../entities/geographic-entity.entity';

@Injectable()
export class GeographicAnalysisService {
  constructor(
    @InjectRepository(GeographicEntity)
    private geoEntityRepository: Repository<GeographicEntity>
  ) {}

  async getProvinceRiskProfile(provinceCode: string): Promise<any> {
    // Agrégation des risques par province
    const province = await this.geoEntityRepository.findOne({
      where: { code: provinceCode }
    });

    if (!province) {
      throw new Error(`Province ${provinceCode} not found`);
    }

    // Récupération des métriques via TimescaleDB
    const riskMetrics = await this.aggregateRiskMetrics(province.id);
    
    return {
      province: province.name,
      code: province.code,
      coordinates: province.coordinates,
      riskMetrics: {
        overallRisk: riskMetrics.avgRiskScore,
        totalEntities: riskMetrics.entityCount,
        highRiskCount: riskMetrics.highRiskCount,
        defaultRate: riskMetrics.defaultRate,
        concentrationRisk: riskMetrics.concentrationRisk
      },
      sectorBreakdown: riskMetrics.sectorBreakdown,
      trends: riskMetrics.trends
    };
  }

  async getMarketConcentration(): Promise<any> {
    // Calcul de la concentration du marché par région et secteur
    // Index de Herfindahl-Hirschman pour mesurer la concentration
    
    const query = `
      SELECT 
        province,
        sector_code,
        sum(metric_value) as total_exposure,
        count(distinct entity_id) as entity_count
      FROM risk_metrics 
      WHERE metric_name = 'credit_exposure'
        AND time >= NOW() - INTERVAL '30 days'
      GROUP BY province, sector_code
    `;

    // Calcul de l'index HHI par province et secteur
    // HHI = Σ(part de marché)²
    
    return {
      concentrationIndex: 0.25, // Exemple
      riskLevel: 'MEDIUM',
      recommendations: [
        'Diversifier l\'exposition géographique',
        'Réduire la concentration dans le secteur minier'
      ]
    };
  }

  private async aggregateRiskMetrics(provinceId: string): Promise<any> {
    // Implémentation de l'agrégation des métriques
    // Connexion à TimescaleDB pour récupérer les données temporelles
    return {
      avgRiskScore: 5.2,
      entityCount: 1250,
      highRiskCount: 89,
      defaultRate: 0.12,
      concentrationRisk: 0.35,
      sectorBreakdown: {},
      trends: {}
    };
  }
}
```

## 📊 INTÉGRATION KAFKA

### Configuration des Consumers d'Événements

```typescript
// src/modules/event-processing/services/kafka-consumer.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { RiskCalculationService } from '../risk-analysis/services/risk-calculation.service';
import { FraudDetectionService } from '../fraud-detection/services/fraud-detection.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private riskCalculationService: RiskCalculationService,
    private fraudDetectionService: FraudDetectionService
  ) {
    this.kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: ['localhost:9092'] // Configuration depuis ENV
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'analytics-risk-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    
    // Souscription aux topics
    await this.consumer.subscribe({ topics: [
      'sme.transaction.created',
      'sme.accounting.updated', 
      'portfolio.credit.disbursed',
      'portfolio.payment.received',
      'portfolio.payment.defaulted',
      'customer.profile.updated'
    ]});

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.processMessage(payload);
      }
    });
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    const data = JSON.parse(message.value?.toString() || '{}');

    this.logger.log(`Processing message from topic: ${topic}`);

    try {
      switch (topic) {
        case 'sme.transaction.created':
          await this.handleTransactionCreated(data);
          break;
          
        case 'sme.accounting.updated':
          await this.handleAccountingUpdated(data);
          break;
          
        case 'portfolio.payment.defaulted':
          await this.handlePaymentDefaulted(data);
          break;
          
        case 'customer.profile.updated':
          await this.handleCustomerProfileUpdated(data);
          break;
          
        default:
          this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}:`, error);
    }
  }

  private async handleTransactionCreated(data: any): Promise<void> {
    // 1. Analyse de fraude en temps réel
    const fraudAlerts = await this.fraudDetectionService.analyzeTransaction(data);
    
    // 2. Mise à jour du profil de risque de l'entité
    if (data.entityType === 'SME') {
      await this.riskCalculationService.calculateSMERisk(data.entityId, data);
    }
    
    // 3. Stockage en TimescaleDB pour analyse temporelle
    await this.storeTimeSeriesData('transaction', data);
  }

  private async handleAccountingUpdated(data: any): Promise<void> {
    // Recalcul complet du risque financier de la PME
    await this.riskCalculationService.calculateSMERisk(data.smeId, data);
  }

  private async handlePaymentDefaulted(data: any): Promise<void> {
    // Mise à jour immédiate du score de risque
    // Déclenchement d'alertes systémiques si nécessaire
    // Analyse de contagion possible
  }

  private async storeTimeSeriesData(type: string, data: any): Promise<void> {
    // Stockage dans TimescaleDB pour analyse temporelle
  }
}
```

Cette structure fournit les fondations complètes pour transformer le microservice analytics en centre de surveillance des risques financiers sophistiqué, respectant les principes du financial engineering moderne.
