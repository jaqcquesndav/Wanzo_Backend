import { ApiProperty } from '@nestjs/swagger';
import { FinancingRecord, FinancingRequestStatus, FinancingType } from '../entities/financing-record.entity';

// DTO pour la réponse d'une demande de financement
export class FinancingRequestResponseDto {
  @ApiProperty({ description: 'Identifiant unique de la demande', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'ID de l\'entreprise', example: '123e4567-e89b-12d3-a456-426614174001' })
  businessId: string;

  @ApiProperty({ description: 'ID du produit de financement', example: '123e4567-e89b-12d3-a456-426614174002' })
  productId: string;

  @ApiProperty({ description: 'Type de financement', enum: FinancingType, example: 'businessLoan' })
  type: FinancingType;

  @ApiProperty({ description: 'Montant demandé', example: 5000.00 })
  amount: number;

  @ApiProperty({ description: 'Devise (CDF, USD, etc.)', example: 'CDF' })
  currency: string;

  @ApiProperty({ description: 'Durée en mois', example: 12 })
  term: number;

  @ApiProperty({ description: 'Objet du financement', example: 'Achat d\'équipements' })
  purpose: string;

  @ApiProperty({ description: 'Statut de la demande', enum: FinancingRequestStatus, example: 'submitted' })
  status: FinancingRequestStatus;

  @ApiProperty({ description: 'ID de l\'institution financière', example: '123e4567-e89b-12d3-a456-426614174003' })
  institutionId: string;

  @ApiProperty({ description: 'Date de soumission', example: '2023-08-01T12:30:00.000Z' })
  applicationDate: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour du statut', example: '2023-08-02T10:15:00.000Z' })
  lastStatusUpdateDate: Date;

  @ApiProperty({ description: 'Date d\'approbation (si applicable)', example: '2023-08-15T14:20:00.000Z' })
  approvalDate: Date;

  @ApiProperty({ description: 'Date de décaissement (si applicable)', example: '2023-08-20T09:45:00.000Z' })
  disbursementDate: Date;

  @ApiProperty({ description: 'Informations sur l\'entreprise' })
  businessInformation: any;

  @ApiProperty({ description: 'Informations financières' })
  financialInformation: any;

  @ApiProperty({ description: 'Documents soumis' })
  documents: any[];

  @ApiProperty({ description: 'Notes supplémentaires' })
  notes: string;

  // ============= CHAMPS SCORE CRÉDIT XGBOOST =============
  
  @ApiProperty({ 
    description: 'Score crédit calculé par XGBoost (1-100)', 
    example: 75,
    minimum: 1,
    maximum: 100,
    required: false
  })
  creditScore?: number;

  @ApiProperty({ 
    description: 'Date de calcul du score crédit', 
    example: '2023-08-01T12:30:00.000Z',
    required: false
  })
  creditScoreCalculatedAt?: Date;

  @ApiProperty({ 
    description: 'Date d\'expiration du score crédit (validité 30 jours)', 
    example: '2023-08-31T12:30:00.000Z',
    required: false
  })
  creditScoreValidUntil?: Date;

  @ApiProperty({ 
    description: 'Version du modèle XGBoost utilisé', 
    example: 'v1.2.3',
    required: false
  })
  creditScoreModelVersion?: string;

  @ApiProperty({ 
    description: 'Niveau de risque basé sur le score crédit', 
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
    required: false
  })
  riskLevel?: string;

  @ApiProperty({ 
    description: 'Score de confiance du modèle (0-1)', 
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false
  })
  confidenceScore?: number;

  @ApiProperty({ 
    description: 'Source des données utilisées pour le calcul', 
    example: 'accounting_transactions_6m',
    required: false
  })
  creditScoreDataSource?: string;

  @ApiProperty({ 
    description: 'Composants détaillés du score crédit XGBoost', 
    example: {
      cashFlowQuality: 78,
      businessStability: 82,
      financialHealth: 65,
      paymentBehavior: 90,
      growthTrend: 70
    },
    required: false
  })
  creditScoreComponents?: {
    cashFlowQuality: number;
    businessStability: number;
    financialHealth: number;
    paymentBehavior: number;
    growthTrend: number;
  };

  @ApiProperty({ 
    description: 'Facteurs explicatifs du score', 
    example: [
      'Flux de trésorerie réguliers détectés',
      'Croissance constante du chiffre d\'affaires',
      'Ratio d\'endettement acceptable'
    ],
    required: false
  })
  creditScoreExplanation?: string[];

  @ApiProperty({ 
    description: 'Recommandations basées sur l\'analyse', 
    example: [
      'Maintenir la régularité des flux',
      'Diversifier les sources de revenus',
      'Optimiser la gestion de trésorerie'
    ],
    required: false
  })
  creditScoreRecommendations?: string[];

  // ============= FIN CHAMPS SCORE CRÉDIT =============

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  // Méthode pour convertir une entité en DTO
  static fromEntity(record: FinancingRecord): FinancingRequestResponseDto {
    const dto = new FinancingRequestResponseDto();
    
    dto.id = record.id;
    dto.businessId = record.businessId;
    dto.productId = record.productId;
    dto.type = record.type;
    dto.amount = record.amount;
    dto.currency = record.currency;
    dto.term = record.term;
    dto.purpose = record.purpose;
    dto.status = record.status;
    dto.institutionId = record.institutionId;
    dto.applicationDate = record.applicationDate;
    dto.lastStatusUpdateDate = record.lastStatusUpdateDate;
    dto.approvalDate = record.approvalDate;
    dto.disbursementDate = record.disbursementDate;
    dto.businessInformation = record.businessInformation;
    dto.financialInformation = record.financialInformation;
    dto.documents = record.documents;
    dto.notes = record.notes;
    
    // Mapping des champs score crédit
    dto.creditScore = record.creditScore;
    dto.creditScoreCalculatedAt = record.creditScoreCalculatedAt;
    dto.creditScoreValidUntil = record.creditScoreValidUntil;
    dto.creditScoreModelVersion = record.creditScoreModelVersion;
    dto.riskLevel = record.riskLevel;
    dto.confidenceScore = record.confidenceScore;
    dto.creditScoreDataSource = record.creditScoreDataSource;
    dto.creditScoreComponents = record.creditScoreComponents;
    dto.creditScoreExplanation = record.creditScoreExplanation;
    dto.creditScoreRecommendations = record.creditScoreRecommendations;
    
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;
    
    return dto;
  }
}
