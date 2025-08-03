import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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
  PROVINCE = 'province',
  CUSTOMER = 'customer'
}

export interface RiskFactors {
  financial: number;      // Score financier
  operational: number;    // Score opérationnel  
  market: number;        // Score marché
  geographic: number;    // Score géographique
  behavioral: number;    // Score comportemental
}

export interface RiskCalculations {
  model: string;
  version: string;
  confidence: number;
  lastCalculation: Date;
  dataPoints: number;
  inputs: Record<string, any>;
}

@Entity('risk_profiles')
@Index(['entityType', 'entityId'])
@Index(['riskLevel', 'updatedAt'])
@Index(['riskScore'])
export class RiskProfile {
  @ApiProperty({ description: 'Identifiant unique du profil de risque' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ 
    description: 'Type d\'entité évaluée',
    enum: EntityType,
    example: EntityType.SME
  })
  @Column({
    type: 'enum',
    enum: EntityType
  })
  entityType!: EntityType;

  @ApiProperty({ description: 'Identifiant de l\'entité évaluée' })
  @Column('uuid')
  entityId!: string;

  @ApiProperty({ 
    description: 'Score de risque de 0 à 10',
    example: 5.75,
    minimum: 0,
    maximum: 10
  })
  @Column('decimal', { precision: 4, scale: 2 })
  riskScore!: number;

  @ApiProperty({ 
    description: 'Niveau de risque catégorisé',
    enum: RiskLevel,
    example: RiskLevel.MEDIUM
  })
  @Column({
    type: 'enum',
    enum: RiskLevel
  })
  riskLevel!: RiskLevel;

  @ApiProperty({ 
    description: 'Probabilité de défaut (0-1)',
    example: 0.125,
    required: false
  })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  defaultProbability?: number;

  @ApiProperty({ 
    description: 'Taux de recouvrement estimé (0-1)',
    example: 0.75,
    required: false
  })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  recoveryRate?: number;

  @ApiProperty({ 
    description: 'Détail des facteurs de risque',
    example: {
      financial: 6.2,
      operational: 4.8,
      market: 5.1,
      geographic: 3.5,
      behavioral: 7.0
    },
    required: false
  })
  @Column('jsonb', { nullable: true })
  riskFactors?: RiskFactors;

  @ApiProperty({ 
    description: 'Métadonnées du calcul',
    required: false
  })
  @Column('jsonb', { nullable: true })
  calculations?: RiskCalculations;

  @ApiProperty({ description: 'Province (pour agrégation géographique)', required: false })
  @Column({ nullable: true })
  province?: string;

  @ApiProperty({ description: 'Secteur d\'activité (pour agrégation sectorielle)', required: false })
  @Column({ nullable: true })
  sector?: string;

  @ApiProperty({ description: 'Institution financière (si applicable)', required: false })
  @Column('uuid', { nullable: true })
  institutionId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Détermine le niveau de risque basé sur le score
   */
  static determineRiskLevel(score: number): RiskLevel {
    if (score < 2) return RiskLevel.VERY_LOW;
    if (score < 4) return RiskLevel.LOW;
    if (score < 6) return RiskLevel.MEDIUM;
    if (score < 8) return RiskLevel.HIGH;
    return RiskLevel.VERY_HIGH;
  }

  /**
   * Vérifie si l'entité est considérée comme à haut risque
   */
  isHighRisk(): boolean {
    return this.riskLevel === RiskLevel.HIGH || this.riskLevel === RiskLevel.VERY_HIGH;
  }

  /**
   * Retourne une recommandation basée sur le niveau de risque
   */
  getRecommendation(): string {
    switch (this.riskLevel) {
      case RiskLevel.VERY_LOW:
        return 'Risque très faible - Conditions préférentielles applicables';
      case RiskLevel.LOW:
        return 'Risque faible - Surveillance standard';
      case RiskLevel.MEDIUM:
        return 'Risque modéré - Surveillance renforcée recommandée';
      case RiskLevel.HIGH:
        return 'Risque élevé - Garanties supplémentaires requises';
      case RiskLevel.VERY_HIGH:
        return 'Risque très élevé - Approbation spéciale requise';
      default:
        return 'Évaluation en cours';
    }
  }
}
