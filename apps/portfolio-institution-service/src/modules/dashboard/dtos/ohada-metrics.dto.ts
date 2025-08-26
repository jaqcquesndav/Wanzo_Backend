import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  RiskLevel, 
  RiskRating, 
  RegulatoryFramework, 
  ComplianceStatus 
} from '../interfaces/dashboard.interface';

export class BalanceAGEDto {
  @ApiProperty({ description: 'Pourcentage 0-30 jours' })
  @IsNumber()
  current: number;

  @ApiProperty({ description: 'Pourcentage 31-60 jours' })
  @IsNumber()
  days30: number;

  @ApiProperty({ description: 'Pourcentage 61-90 jours' })
  @IsNumber()
  days60: number;

  @ApiProperty({ description: 'Pourcentage 90+ jours' })
  @IsNumber()
  days90Plus: number;
}

export class RegulatoryComplianceDto {
  @ApiProperty({ description: 'Conformité BCEAO (NPL < 5%)' })
  @IsBoolean()
  bceaoCompliant: boolean;

  @ApiProperty({ description: 'Conformité OHADA provisions' })
  @IsBoolean()
  ohadaProvisionCompliant: boolean;

  @ApiProperty({ description: 'Notation de risque', enum: RiskRating })
  @IsEnum(RiskRating)
  riskRating: RiskRating;
}

export class OHADAMetricsDto {
  @ApiProperty({ description: 'ID du portefeuille' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Nom du portefeuille' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Secteur d\'activité' })
  @IsString()
  sector: string;

  @ApiProperty({ description: 'Montant total' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Contrats actifs' })
  @IsNumber()
  activeContracts: number;

  @ApiProperty({ description: 'Taille moyenne des prêts' })
  @IsNumber()
  avgLoanSize: number;

  @ApiProperty({ description: 'Ratio NPL (%)' })
  @IsNumber()
  nplRatio: number;

  @ApiProperty({ description: 'Taux de provisionnement (%)' })
  @IsNumber()
  provisionRate: number;

  @ApiProperty({ description: 'Efficacité de recouvrement (%)' })
  @IsNumber()
  collectionEfficiency: number;

  @ApiProperty({ description: 'Balance âgée', type: BalanceAGEDto })
  @ValidateNested()
  @Type(() => BalanceAGEDto)
  balanceAGE: BalanceAGEDto;

  @ApiProperty({ description: 'Return on Assets (%)' })
  @IsNumber()
  roa: number;

  @ApiProperty({ description: 'Rendement du portefeuille (%)' })
  @IsNumber()
  portfolioYield: number;

  @ApiProperty({ description: 'Niveau de risque', enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Taux de croissance (%)' })
  @IsNumber()
  growthRate: number;

  @ApiProperty({ description: 'Performance mensuelle', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  monthlyPerformance: number[];

  @ApiProperty({ description: 'Dernière activité' })
  @IsString()
  lastActivity: string;

  @ApiPropertyOptional({ description: 'Conformité réglementaire', type: RegulatoryComplianceDto })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  @IsOptional()
  regulatoryCompliance?: RegulatoryComplianceDto;
}

export class MetadataDto {
  @ApiProperty({ description: 'Nombre total de portefeuilles' })
  @IsNumber()
  totalPortfolios: number;

  @ApiProperty({ description: 'Date de calcul' })
  @IsString()
  calculationDate: string;

  @ApiProperty({ description: 'Cadre réglementaire', enum: RegulatoryFramework })
  @IsEnum(RegulatoryFramework)
  regulatoryFramework: RegulatoryFramework;

  @ApiProperty({ description: 'Statut de conformité', enum: ComplianceStatus })
  @IsEnum(ComplianceStatus)
  complianceStatus: ComplianceStatus;
}

export class BenchmarksDto {
  @ApiProperty({ description: 'Ratio NPL moyen (seuil BCEAO: 5%)' })
  @IsNumber()
  avgNplRatio: number;

  @ApiProperty({ description: 'Taux de provision moyen (norme OHADA: 3-5%)' })
  @IsNumber()
  avgProvisionRate: number;

  @ApiProperty({ description: 'ROA moyen (marché CEMAC: 3.2%)' })
  @IsNumber()
  avgROA: number;

  @ApiProperty({ description: 'Rendement moyen (marché: 14.5%)' })
  @IsNumber()
  avgYield: number;

  @ApiProperty({ description: 'Efficacité de recouvrement (standard: 90%)' })
  @IsNumber()
  collectionEfficiency: number;
}

export class OHADAMetricsResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Métriques OHADA', type: [OHADAMetricsDto] })
  @ValidateNested({ each: true })
  @Type(() => OHADAMetricsDto)
  @IsArray()
  data: OHADAMetricsDto[];

  @ApiProperty({ description: 'Métadonnées', type: MetadataDto })
  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;

  @ApiProperty({ description: 'Benchmarks', type: BenchmarksDto })
  @ValidateNested()
  @Type(() => BenchmarksDto)
  benchmarks: BenchmarksDto;
}

export class SingleOHADAMetricsResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Métriques OHADA', type: OHADAMetricsDto })
  @ValidateNested()
  @Type(() => OHADAMetricsDto)
  data: OHADAMetricsDto;
}
