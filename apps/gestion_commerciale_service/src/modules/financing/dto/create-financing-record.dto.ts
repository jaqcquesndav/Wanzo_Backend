import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, IsNotEmpty, IsNumber, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsUrl,
  IsInt, IsPositive, Min, IsUUID, IsCurrency
} from 'class-validator';
import { Type } from 'class-transformer';
import { FinancingType, FinancingRequestStatus } from '../entities/financing-record.entity';

export class DocumentDto {
  @ApiProperty({ description: 'Type du document', example: 'businessPlan' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Nom du document', example: 'Plan d\'affaires 2025' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL du document', example: 'https://example.com/business_plan.pdf' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class ExistingLoanDto {
  @ApiProperty({ description: 'Prêteur', example: 'Banque XYZ' })
  @IsString()
  @IsNotEmpty()
  lender: string;

  @ApiProperty({ description: 'Montant initial', example: 10000 })
  @IsNumber()
  @IsPositive()
  originalAmount: number;

  @ApiProperty({ description: 'Solde restant', example: 6000 })
  @IsNumber()
  @IsPositive()
  outstandingBalance: number;

  @ApiProperty({ description: 'Mensualité', example: 500 })
  @IsNumber()
  @IsPositive()
  monthlyPayment: number;
}

export class BusinessInformationDto {
  @ApiProperty({ description: 'Nom de l\'entreprise', example: 'Ma Société SARL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Numéro d\'enregistrement', example: 'RCCM/CD/KIN/123456' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ description: 'Adresse', example: '123 Avenue de la Libération, Kinshasa' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Années d\'activité', example: 3 })
  @IsInt()
  @IsPositive()
  yearsInBusiness: number;

  @ApiProperty({ description: 'Nombre d\'employés', example: 10 })
  @IsInt()
  @IsPositive()
  numberOfEmployees: number;

  @ApiProperty({ description: 'Chiffre d\'affaires annuel', example: 50000 })
  @IsNumber()
  @IsPositive()
  annualRevenue: number;
}

export class FinancialInformationDto {
  @ApiProperty({ description: 'Revenu mensuel', example: 5000 })
  @IsNumber()
  @IsPositive()
  monthlyRevenue: number;

  @ApiProperty({ description: 'Dépenses mensuelles', example: 3000 })
  @IsNumber()
  @IsPositive()
  monthlyExpenses: number;

  @ApiPropertyOptional({ 
    description: 'Prêts existants',
    type: [ExistingLoanDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExistingLoanDto)
  @IsOptional()
  existingLoans?: ExistingLoanDto[];
}

export class CreateFinancingRecordDto {
  @ApiPropertyOptional({ description: 'ID du produit de financement', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'Type de financement',
    enum: FinancingType,
    example: FinancingType.BUSINESS_LOAN,
  })
  @IsEnum(FinancingType)
  @IsNotEmpty()
  type: FinancingType;

  @ApiProperty({ description: 'Montant demandé', example: 5000.00 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Devise (CDF, USD, etc.)', example: 'CDF' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Durée en mois', example: 12 })
  @IsInt()
  @IsPositive()
  term: number;

  @ApiProperty({ description: 'Objet du financement', example: 'Achat d\'équipements' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiPropertyOptional({ description: 'ID de l\'institution financière', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsUUID()
  @IsOptional()
  institutionId?: string;

  @ApiProperty({ description: 'Informations sur l\'entreprise' })
  @ValidateNested()
  @Type(() => BusinessInformationDto)
  businessInformation: BusinessInformationDto;

  @ApiProperty({ description: 'Informations financières' })
  @ValidateNested()
  @Type(() => FinancialInformationDto)
  financialInformation: FinancialInformationDto;

  @ApiPropertyOptional({ 
    description: 'Documents soumis',
    type: [DocumentDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  @IsOptional()
  documents?: DocumentDto[];

  @ApiPropertyOptional({ description: 'Notes supplémentaires' })
  @IsString()
  @IsOptional()
  notes?: string;
}
