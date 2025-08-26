import { IsString, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ComplianceStatus, RiskLevel } from '../interfaces/dashboard.interface';

export class ComplianceDetailDto {
  @ApiProperty({ description: 'Seuil' })
  @IsNumber()
  threshold?: number;

  @ApiProperty({ description: 'Seuil minimum' })
  @IsNumber()
  minThreshold?: number;

  @ApiProperty({ description: 'Seuil maximum' })
  @IsNumber()
  maxThreshold?: number;

  @ApiProperty({ description: 'Moyenne actuelle' })
  @IsNumber()
  currentAvg: number;

  @ApiProperty({ description: 'Nombre de portefeuilles conformes' })
  @IsNumber()
  compliantCount: number;

  @ApiProperty({ description: 'Statut de conformité', enum: ComplianceStatus })
  status: ComplianceStatus;
}

export class ComplianceDetailsDto {
  @ApiProperty({ description: 'Conformité BCEAO', type: ComplianceDetailDto })
  @ValidateNested()
  @Type(() => ComplianceDetailDto)
  bceaoCompliance: ComplianceDetailDto;

  @ApiProperty({ description: 'Conformité provisions OHADA', type: ComplianceDetailDto })
  @ValidateNested()
  @Type(() => ComplianceDetailDto)
  ohadaProvisionCompliance: ComplianceDetailDto;
}

export class ComplianceSummaryDto {
  @ApiProperty({ description: 'Statut global de conformité', enum: ComplianceStatus })
  status: ComplianceStatus;

  @ApiProperty({ description: 'Niveau de risque global', enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Nombre total de portefeuilles' })
  @IsNumber()
  totalPortfolios: number;

  @ApiProperty({ description: 'Nombre de portefeuilles non conformes' })
  @IsNumber()
  nonCompliantCount: number;

  @ApiProperty({ description: 'Taux de conformité' })
  @IsString()
  complianceRate: string;

  @ApiProperty({ description: 'Détails de conformité', type: ComplianceDetailsDto })
  @ValidateNested()
  @Type(() => ComplianceDetailsDto)
  details: ComplianceDetailsDto;
}

export class ComplianceSummaryResponseDto {
  @ApiProperty({ description: 'Succès de la requête' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Résumé de conformité', type: ComplianceSummaryDto })
  @ValidateNested()
  @Type(() => ComplianceSummaryDto)
  data: ComplianceSummaryDto;
}
