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
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;
    
    return dto;
  }
}
