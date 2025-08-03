import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum GeographicLevel {
  COUNTRY = 'country',
  PROVINCE = 'province', 
  CITY = 'city',
  COMMUNE = 'commune',
  TERRITORY = 'territory'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  bounds?: {
    north: number;
    south: number; 
    east: number;
    west: number;
  };
}

export interface Demographics {
  population: number;
  economicActivity: string[];
  mainSectors: string[];
  gdpContribution?: number;
  urbanizationRate?: number;
}

export interface RiskMetrics {
  overallRisk: number;
  economicStability: number;
  infrastructureQuality: number;
  businessEnvironment: number;
  politicalStability: number;
  creditConcentration?: number;
}

@Entity('geographic_entities')
@Index(['level', 'parentId'])
@Index(['code'])
@Index(['name'])
export class GeographicEntity {
  @ApiProperty({ description: 'Identifiant unique de l\'entité géographique' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ 
    description: 'Code unique de l\'entité (CD, KIN, GOMBE, etc.)',
    example: 'KIN'
  })
  @Column({ unique: true })
  code!: string;

  @ApiProperty({ 
    description: 'Nom de l\'entité géographique',
    example: 'Kinshasa'
  })
  @Column()
  name!: string;

  @ApiProperty({ 
    description: 'Niveau géographique',
    enum: GeographicLevel,
    example: GeographicLevel.PROVINCE
  })
  @Column({
    type: 'enum',
    enum: GeographicLevel
  })
  level!: GeographicLevel;

  @ApiProperty({ 
    description: 'Identifiant de l\'entité parente',
    required: false
  })
  @Column('uuid', { nullable: true })
  parentId?: string;

  @ApiProperty({ 
    description: 'Nom de l\'entité parente',
    required: false
  })
  @Column({ nullable: true })
  parentName?: string;

  @ApiProperty({ 
    description: 'Coordonnées géographiques',
    example: {
      latitude: -4.4419,
      longitude: 15.2663,
      bounds: {
        north: -4.0,
        south: -5.0,
        east: 16.0,
        west: 14.0
      }
    },
    required: false
  })
  @Column('jsonb', { nullable: true })
  coordinates?: Coordinates;

  @ApiProperty({ 
    description: 'Données démographiques et économiques',
    example: {
      population: 15000000,
      economicActivity: ['commerce', 'services', 'administration'],
      mainSectors: ['COM', 'SER', 'ADM']
    },
    required: false
  })
  @Column('jsonb', { nullable: true })
  demographics?: Demographics;

  @ApiProperty({ 
    description: 'Métriques de risque géographique',
    example: {
      overallRisk: 4.2,
      economicStability: 6.1,
      infrastructureQuality: 5.8,
      businessEnvironment: 7.2
    },
    required: false
  })
  @Column('jsonb', { nullable: true })
  riskMetrics?: RiskMetrics;

  @ApiProperty({ description: 'Statut actif/inactif' })
  @Column({ default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Ordre d\'affichage pour les listes' })
  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Calcule le score de risque global de l'entité géographique
   */
  calculateOverallRiskScore(): number {
    if (!this.riskMetrics) return 5.0; // Score neutre par défaut

    const weights = {
      economicStability: 0.3,
      infrastructureQuality: 0.25,
      businessEnvironment: 0.25,
      politicalStability: 0.2
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      const value = this.riskMetrics?.[key as keyof RiskMetrics];
      if (typeof value === 'number') {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 5.0;
  }

  /**
   * Détermine le niveau de risque géographique
   */
  getRiskLevel(): string {
    const score = this.riskMetrics?.overallRisk || this.calculateOverallRiskScore();
    
    if (score <= 3) return 'FAIBLE';
    if (score <= 5) return 'MODÉRÉ';
    if (score <= 7) return 'ÉLEVÉ';
    return 'TRÈS ÉLEVÉ';
  }

  /**
   * Vérifie si cette entité est une zone à haut risque
   */
  isHighRiskArea(): boolean {
    const score = this.riskMetrics?.overallRisk || this.calculateOverallRiskScore();
    return score > 7;
  }

  /**
   * Retourne les secteurs économiques dominants
   */
  getDominantSectors(): string[] {
    return this.demographics?.mainSectors || [];
  }

  /**
   * Calcule la densité de population (si superficie disponible)
   */
  calculatePopulationDensity(surfaceAreaKm2?: number): number | null {
    if (!this.demographics?.population || !surfaceAreaKm2) return null;
    return this.demographics.population / surfaceAreaKm2;
  }
}
