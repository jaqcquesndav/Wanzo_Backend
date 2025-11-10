/**
 * DTOs FINANCIERS UNIFIÉS
 * 
 * Ce fichier centralise TOUS les DTOs de transactions financières
 * pour éliminer les duplications trouvées dans tous les services.
 * 
 * Remplace et unifie:
 * - apps/customer-service/src/modules/billing/dtos/*.dto.ts
 * - apps/payment-service/src/modules/payments/dtos/*.dto.ts
 * - apps/gestion_commerciale_service/src/modules/financial-transactions/dtos/*.dto.ts
 * - apps/admin-service/src/modules/finance/dtos/*.dto.ts
 * - apps/portfolio-institution-service/src/modules/dtos
 * 
 * Standards appliqués:
 * - ISO 20022 Financial Services
 * - ISO 4217 Currency Codes
 * - BIC/SWIFT Standards
 * - FATF/GAFI AML Compliance
 */

import { 
  ApiProperty, 
  ApiPropertyOptional, 
  PartialType, 
  PickType, 
  OmitType 
} from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsObject, 
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  Min, 
  Max, 
  Length,
  Matches,
  ValidateNested,
  IsEmail,
  IsPhoneNumber,
  IsISO4217CurrencyCode
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Import des enums et entités unifiés
import {
  UnifiedPaymentMethod,
  UnifiedTransactionStatus,
  UnifiedTransactionType,
  SupportedCurrency,
  TransactionPriority,
  TransactionChannel,
  AMLRiskLevel
} from '../enums/financial-enums';

import { 
  ServiceContext, 
  ExtendedMetadata 
} from '../entities/unified-financial-transaction.entity';

import { ISO4217CurrencyCode } from '../standards/iso-standards';

/**
 * ================================
 * DTOs DE CRÉATION DE TRANSACTION
 * ================================
 */

/**
 * DTO de base pour créer une transaction financière
 * Applique toutes les validations ISO et compliance
 */
export class CreateUnifiedTransactionDto {
  @ApiProperty({ 
    enum: UnifiedTransactionType,
    description: 'Type de transaction (conforme ISO 20022)',
    example: UnifiedTransactionType.PAYMENT
  })
  @IsEnum(UnifiedTransactionType, {
    message: 'Type de transaction invalide. Doit être conforme ISO 20022.'
  })
  @IsNotEmpty()
  type!: UnifiedTransactionType;

  @ApiProperty({ 
    type: 'number',
    description: 'Montant de la transaction (précision bancaire)',
    example: 1000.50,
    minimum: 0.01,
    maximum: 999999999.99
  })
  @IsNumber({ 
    maxDecimalPlaces: 2,
    allowNaN: false,
    allowInfinity: false
  }, {
    message: 'Le montant doit être un nombre avec maximum 2 décimales'
  })
  @Min(0.01, { message: 'Le montant minimum est 0.01' })
  @Max(999999999.99, { message: 'Le montant maximum est 999,999,999.99' })
  @Transform(({ value }) => parseFloat(value))
  amount!: number;

  @ApiProperty({ 
    enum: SupportedCurrency,
    description: 'Devise (conforme ISO 4217)',
    example: SupportedCurrency.USD
  })
  @IsEnum(SupportedCurrency, {
    message: 'Devise non supportée. Doit être conforme ISO 4217.'
  })
  @IsNotEmpty()
  currency!: SupportedCurrency;

  @ApiProperty({ 
    enum: UnifiedPaymentMethod,
    description: 'Méthode de paiement (conforme ISO 20022)',
    example: UnifiedPaymentMethod.CARD_PAYMENT
  })
  @IsEnum(UnifiedPaymentMethod, {
    message: 'Méthode de paiement invalide. Doit être conforme ISO 20022.'
  })
  @IsNotEmpty()
  paymentMethod!: UnifiedPaymentMethod;

  @ApiProperty({ 
    enum: TransactionChannel,
    description: 'Canal d\'initiation de la transaction',
    example: TransactionChannel.WEB
  })
  @IsEnum(TransactionChannel, {
    message: 'Canal de transaction invalide'
  })
  @IsNotEmpty()
  channel!: TransactionChannel;

  @ApiPropertyOptional({ 
    enum: TransactionPriority,
    description: 'Priorité de traitement',
    example: TransactionPriority.NORMAL
  })
  @IsOptional()
  @IsEnum(TransactionPriority, {
    message: 'Priorité de transaction invalide'
  })
  priority?: TransactionPriority = TransactionPriority.NORMAL;

  @ApiPropertyOptional({ 
    type: 'string',
    description: 'Description de la transaction',
    example: 'Paiement facture #INV-2024-001',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'La description ne peut dépasser 500 caractères' })
  description?: string;

  @ApiPropertyOptional({ 
    type: 'number',
    description: 'Frais de transaction',
    example: 5.00,
    minimum: 0,
    maximum: 999999.99
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Les frais ne peuvent être négatifs' })
  @Max(999999.99, { message: 'Frais maximum: 999,999.99' })
  transactionFee?: number;

  @ApiPropertyOptional({ 
    type: 'number',
    description: 'Taux de change appliqué',
    example: 1.0850,
    minimum: 0.000001,
    maximum: 999999.999999
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001, { message: 'Taux de change invalide' })
  @Max(999999.999999, { message: 'Taux de change trop élevé' })
  exchangeRate?: number;

  @ApiPropertyOptional({ 
    type: 'object',
    description: 'Métadonnées étendues spécifiques au contexte'
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ExtendedMetadataDto)
  extendedMetadata?: ExtendedMetadataDto;

  @ApiProperty({ 
    enum: ServiceContext,
    description: 'Contexte de service initiateur',
    example: ServiceContext.CUSTOMER
  })
  @IsEnum(ServiceContext, {
    message: 'Contexte de service invalide'
  })
  @IsNotEmpty()
  serviceContext!: ServiceContext;
}

/**
 * DTO pour les métadonnées étendues avec validation par contexte
 */
export class ExtendedMetadataDto implements ExtendedMetadata {
  // === CUSTOMER SERVICE CONTEXT ===
  @ApiPropertyOptional({ description: 'ID du client' })
  @IsOptional()
  @IsUUID('4', { message: 'ID client invalide' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID de la facture' })
  @IsOptional()
  @IsUUID('4', { message: 'ID facture invalide' })
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'abonnement' })
  @IsOptional()
  @IsUUID('4', { message: 'ID abonnement invalide' })
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'ID du plan' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: 'Cycle de facturation' })
  @IsOptional()
  @IsString()
  billingCycle?: string;

  // === PAYMENT SERVICE CONTEXT ===
  @ApiPropertyOptional({ description: 'ID du fournisseur de paiement' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Nom du fournisseur' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  providerName?: string;

  @ApiPropertyOptional({ description: 'ID transaction du fournisseur' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  providerTransactionId?: string;

  @ApiPropertyOptional({ description: 'ID de session' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone client' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Numéro de téléphone invalide' })
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Opérateur télécom' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  telecom?: string;

  @ApiPropertyOptional({ description: 'Référence client' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  clientReference?: string;

  // === COMMERCIAL SERVICE CONTEXT ===
  @ApiPropertyOptional({ description: 'ID du fournisseur' })
  @IsOptional()
  @IsUUID('4', { message: 'ID fournisseur invalide' })
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID du contrat' })
  @IsOptional()
  @IsUUID('4', { message: 'ID contrat invalide' })
  contractId?: string;

  @ApiPropertyOptional({ description: 'Numéro de facture' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9-_]+$/, { message: 'Format de numéro de facture invalide' })
  invoiceNumber?: string;

  // === ADMIN SERVICE CONTEXT ===
  @ApiPropertyOptional({ description: 'ID utilisateur admin' })
  @IsOptional()
  @IsUUID('4', { message: 'ID utilisateur admin invalide' })
  adminUserId?: string;

  @ApiPropertyOptional({ description: 'ID du département' })
  @IsOptional()
  @IsUUID('4', { message: 'ID département invalide' })
  departmentId?: string;

  @ApiPropertyOptional({ description: 'ID du budget' })
  @IsOptional()
  @IsUUID('4', { message: 'ID budget invalide' })
  budgetId?: string;

  @ApiPropertyOptional({ description: 'Niveau d\'approbation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  approvalLevel?: number;

  // === PORTFOLIO SERVICE CONTEXT ===
  @ApiPropertyOptional({ description: 'ID du portefeuille' })
  @IsOptional()
  @IsUUID('4', { message: 'ID portefeuille invalide' })
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'institution' })
  @IsOptional()
  @IsUUID('4', { message: 'ID institution invalide' })
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Type de décaissement' })
  @IsOptional()
  @IsString()
  disbursementType?: string;

  @ApiPropertyOptional({ description: 'ID du prêt' })
  @IsOptional()
  @IsUUID('4', { message: 'ID prêt invalide' })
  loanId?: string;

  @ApiPropertyOptional({ description: 'ID échéancier remboursement' })
  @IsOptional()
  @IsUUID('4', { message: 'ID échéancier invalide' })
  repaymentScheduleId?: string;

  // === TECHNICAL METADATA ===
  @ApiPropertyOptional({ description: 'User Agent du navigateur' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Adresse IP' })
  @IsOptional()
  @IsString()
  @Matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, {
    message: 'Adresse IP invalide'
  })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Empreinte de l\'appareil' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ 
    type: 'object',
    description: 'Géolocalisation'
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GeolocationDto)
  geolocation?: GeolocationDto;

  // === BUSINESS METADATA ===
  @ApiPropertyOptional({ description: 'Catégorie business' })
  @IsOptional()
  @IsString()
  businessCategory?: string;

  @ApiPropertyOptional({ description: 'Numéro TVA' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9A-Z]+$/, { message: 'Format de numéro TVA invalide' })
  vatNumber?: string;

  @ApiPropertyOptional({ description: 'Exonération fiscale' })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @ApiPropertyOptional({ description: 'Année fiscale' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{4}$/, { message: 'Format d\'année fiscale invalide' })
  fiscalYear?: string;

  // === LEGACY MIGRATION ===
  @ApiPropertyOptional({ description: 'ID système legacy' })
  @IsOptional()
  @IsString()
  legacySystemId?: string;

  @ApiPropertyOptional({ description: 'Table legacy' })
  @IsOptional()
  @IsString()
  legacyTableName?: string;

  @ApiPropertyOptional({ description: 'Lot de migration' })
  @IsOptional()
  @IsString()
  migrationBatch?: string;

  @ApiPropertyOptional({ description: 'Date de migration' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  migrationDate?: Date;
}

/**
 * DTO pour la géolocalisation
 */
export class GeolocationDto {
  @ApiProperty({ description: 'Latitude', example: -4.4419 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: 15.2663 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({ description: 'Code pays ISO', example: 'CD' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  country!: string;

  @ApiProperty({ description: 'Ville', example: 'Kinshasa' })
  @IsString()
  @Length(1, 100)
  city!: string;
}

/**
 * ================================
 * DTOs SPÉCIALISÉS PAR SERVICE
 * ================================
 */

/**
 * DTO pour transactions customer-service (billing/payments)
 */
export class CreateCustomerPaymentDto {
  @ApiProperty({ 
    type: 'number',
    description: 'Montant de la transaction',
    example: 1000.50
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ 
    enum: SupportedCurrency,
    description: 'Devise'
  })
  @IsEnum(SupportedCurrency)
  currency!: SupportedCurrency;

  @ApiProperty({ 
    enum: UnifiedPaymentMethod,
    description: 'Méthode de paiement'
  })
  @IsEnum(UnifiedPaymentMethod)
  paymentMethod!: UnifiedPaymentMethod;

  @ApiProperty({ 
    enum: TransactionChannel,
    description: 'Canal d\'initiation'
  })
  @IsEnum(TransactionChannel)
  channel!: TransactionChannel;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Frais de transaction' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  transactionFee?: number;
  
  @ApiProperty({ description: 'ID du client' })
  @IsUUID('4')
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({ description: 'ID de la facture' })
  @IsOptional()
  @IsUUID('4')
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'abonnement' })
  @IsOptional()
  @IsUUID('4')
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'ID du plan' })
  @IsOptional()
  @IsString()
  planId?: string;
}

/**
 * DTO pour transactions payment-service
 */
export class CreatePaymentServiceTransactionDto {
  @ApiProperty({ 
    type: 'number',
    description: 'Montant de la transaction'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ 
    enum: SupportedCurrency,
    description: 'Devise'
  })
  @IsEnum(SupportedCurrency)
  currency!: SupportedCurrency;

  @ApiProperty({ 
    enum: UnifiedPaymentMethod,
    description: 'Méthode de paiement'
  })
  @IsEnum(UnifiedPaymentMethod)
  paymentMethod!: UnifiedPaymentMethod;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
  
  @ApiProperty({ description: 'Nom du fournisseur de paiement' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  providerName!: string;

  @ApiPropertyOptional({ description: 'ID transaction du fournisseur' })
  @IsOptional()
  @IsString()
  providerTransactionId?: string;

  @ApiPropertyOptional({ description: 'ID de session' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Numéro de téléphone client' })
  @IsString()
  @IsNotEmpty()
  clientPhone!: string;

  @ApiProperty({ description: 'Opérateur télécom' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  telecom!: string;

  @ApiPropertyOptional({ description: 'Référence client' })
  @IsOptional()
  @IsString()
  clientReference?: string;
}

/**
 * DTO pour transactions gestion_commerciale_service
 */
export class CreateCommercialTransactionDto extends PickType(CreateUnifiedTransactionDto, [
  'type', 'amount', 'currency', 'paymentMethod', 'description'
] as const) {
  
  @ApiPropertyOptional({ description: 'ID du client' })
  @IsOptional()
  @IsUUID('4', { message: 'ID client invalide' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID du fournisseur' })
  @IsOptional()
  @IsUUID('4', { message: 'ID fournisseur invalide' })
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID du contrat' })
  @IsOptional()
  @IsUUID('4', { message: 'ID contrat invalide' })
  contractId?: string;

  @ApiPropertyOptional({ description: 'Numéro de facture' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9-_]+$/)
  invoiceNumber?: string;

  // Valeurs par défaut
  serviceContext = ServiceContext.COMMERCIAL;
  channel = TransactionChannel.WEB;
}

/**
 * DTO pour transactions admin-service
 */
export class CreateAdminFinanceDto extends PickType(CreateUnifiedTransactionDto, [
  'type', 'amount', 'currency', 'description'
] as const) {
  
  @ApiProperty({ description: 'ID utilisateur admin' })
  @IsUUID('4', { message: 'ID utilisateur admin invalide' })
  @IsNotEmpty()
  adminUserId!: string;

  @ApiPropertyOptional({ description: 'ID du département' })
  @IsOptional()
  @IsUUID('4', { message: 'ID département invalide' })
  departmentId?: string;

  @ApiPropertyOptional({ description: 'ID du budget' })
  @IsOptional()
  @IsUUID('4', { message: 'ID budget invalide' })
  budgetId?: string;

  @ApiProperty({ description: 'Niveau d\'approbation requis' })
  @IsNumber()
  @Min(0)
  @Max(5)
  approvalLevel!: number;

  // Valeurs par défaut
  serviceContext = ServiceContext.ADMIN;
  channel = TransactionChannel.WEB;
  paymentMethod = UnifiedPaymentMethod.BANK_TRANSFER;
}

/**
 * DTO pour disbursements portfolio-service
 */
export class CreatePortfolioDisbursementDto extends PickType(CreateUnifiedTransactionDto, [
  'amount', 'currency', 'paymentMethod', 'description'
] as const) {
  
  @ApiProperty({ description: 'ID du portefeuille' })
  @IsUUID('4', { message: 'ID portefeuille invalide' })
  @IsNotEmpty()
  portfolioId!: string;

  @ApiProperty({ description: 'ID de l\'institution' })
  @IsUUID('4', { message: 'ID institution invalide' })
  @IsNotEmpty()
  institutionId!: string;

  @ApiProperty({ description: 'Type de décaissement' })
  @IsString()
  @IsNotEmpty()
  disbursementType!: string;

  @ApiPropertyOptional({ description: 'ID du prêt' })
  @IsOptional()
  @IsUUID('4', { message: 'ID prêt invalide' })
  loanId?: string;

  // Valeurs par défaut
  serviceContext = ServiceContext.PORTFOLIO;
  channel = TransactionChannel.API;
  type = UnifiedTransactionType.DISBURSEMENT;
}

/**
 * ================================
 * DTOs DE MISE À JOUR
 * ================================
 */

/**
 * DTO pour mettre à jour le statut d'une transaction
 */
export class UpdateTransactionStatusDto {
  @ApiProperty({ 
    enum: UnifiedTransactionStatus,
    description: 'Nouveau statut de la transaction'
  })
  @IsEnum(UnifiedTransactionStatus, {
    message: 'Statut de transaction invalide'
  })
  @IsNotEmpty()
  status!: UnifiedTransactionStatus;

  @ApiPropertyOptional({ description: 'Raison du changement de statut' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;
}

/**
 * DTO pour mise à jour complète (partielle de CreateUnifiedTransactionDto)
 */
export class UpdateUnifiedTransactionDto extends PartialType(
  OmitType(CreateUnifiedTransactionDto, ['serviceContext'] as const)
) {}

/**
 * ================================
 * DTOs DE RÉPONSE
 * ================================
 */

/**
 * DTO de réponse pour les transactions
 */
export class UnifiedTransactionResponseDto {
  @ApiProperty({ description: 'ID unique de la transaction' })
  id!: string;

  @ApiProperty({ enum: UnifiedTransactionType })
  type!: UnifiedTransactionType;

  @ApiProperty({ type: 'number' })
  amount!: number;

  @ApiProperty({ enum: SupportedCurrency })
  currency!: SupportedCurrency;

  @ApiProperty({ enum: UnifiedPaymentMethod })
  paymentMethod!: UnifiedPaymentMethod;

  @ApiProperty({ enum: UnifiedTransactionStatus })
  status!: UnifiedTransactionStatus;

  @ApiProperty({ enum: ServiceContext })
  serviceContext!: ServiceContext;

  @ApiProperty({ enum: TransactionChannel })
  channel!: TransactionChannel;

  @ApiProperty({ enum: TransactionPriority })
  priority!: TransactionPriority;

  @ApiPropertyOptional({ type: 'string' })
  description?: string;

  @ApiPropertyOptional({ type: 'number' })
  transactionFee?: number;

  @ApiPropertyOptional({ enum: AMLRiskLevel })
  amlRiskLevel?: AMLRiskLevel;

  @ApiPropertyOptional({ type: 'number' })
  riskScore?: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  completedAt?: Date;

  @ApiPropertyOptional({ type: 'object' })
  extendedMetadata?: ExtendedMetadata;
}

/**
 * DTO de réponse simplifiée pour les listes
 */
export class UnifiedTransactionSummaryDto extends PickType(UnifiedTransactionResponseDto, [
  'id', 'type', 'amount', 'currency', 'status', 'serviceContext', 'createdAt'
] as const) {}

/**
 * ================================
 * DTOs DE FILTRAGE
 * ================================
 */

/**
 * DTO pour filtrer les transactions
 */
export class TransactionFilterDto {
  @ApiPropertyOptional({ enum: ServiceContext, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceContext, { each: true })
  serviceContexts?: ServiceContext[];

  @ApiPropertyOptional({ enum: UnifiedTransactionStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UnifiedTransactionStatus, { each: true })
  statuses?: UnifiedTransactionStatus[];

  @ApiPropertyOptional({ enum: UnifiedTransactionType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UnifiedTransactionType, { each: true })
  types?: UnifiedTransactionType[];

  @ApiPropertyOptional({ enum: SupportedCurrency, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SupportedCurrency, { each: true })
  currencies?: SupportedCurrency[];

  @ApiPropertyOptional({ type: 'number', description: 'Montant minimum' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ type: 'number', description: 'Montant maximum' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ enum: AMLRiskLevel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AMLRiskLevel, { each: true })
  riskLevels?: AMLRiskLevel[];

  @ApiPropertyOptional({ type: 'string', description: 'Recherche textuelle' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search?: string;
}

/**
 * DTO pour la pagination
 */
export class PaginationDto {
  @ApiPropertyOptional({ type: 'number', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ type: 'number', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ type: 'string', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ type: 'string', default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  @Matches(/^(ASC|DESC)$/)
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * DTO de réponse paginée
 */
export class PaginatedTransactionResponseDto {
  @ApiProperty({ type: [UnifiedTransactionResponseDto] })
  data!: UnifiedTransactionResponseDto[];

  @ApiProperty({ type: 'object' })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * ================================
 * DTOs DE RAPPORTS ET ANALYTICS UNIFIÉS
 * ================================
 * Ces DTOs complètent l'architecture existante en fournissant
 * des capacités de reporting cross-services et d'analytics avancés
 */

/**
 * DTO pour les rapports de performance par service
 */
export class ServicePerformanceReportDto {
  @ApiProperty({ enum: ServiceContext })
  @IsEnum(ServiceContext)
  @IsNotEmpty()
  serviceContext!: ServiceContext;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  dateFrom!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  dateTo!: Date;

  @ApiPropertyOptional({ enum: SupportedCurrency, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SupportedCurrency, { each: true })
  currencies?: SupportedCurrency[];

  @ApiPropertyOptional({ enum: UnifiedPaymentMethod, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UnifiedPaymentMethod, { each: true })
  paymentMethods?: UnifiedPaymentMethod[];
}

/**
 * DTO pour analyse cross-service des transactions
 */
export class CrossServiceAnalyticsDto {
  @ApiProperty({ enum: ServiceContext, isArray: true })
  @IsArray()
  @IsEnum(ServiceContext, { each: true })
  @IsNotEmpty()
  serviceContexts!: ServiceContext[];

  @ApiProperty({ type: 'string', format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  analysisDate!: Date;

  @ApiPropertyOptional({ 
    type: 'string',
    description: 'Métrique d\'analyse',
    enum: ['volume', 'amount', 'success_rate', 'fees', 'processing_time']
  })
  @IsOptional()
  @IsString()
  metric?: 'volume' | 'amount' | 'success_rate' | 'fees' | 'processing_time' = 'volume';

  @ApiPropertyOptional({ 
    type: 'string',
    description: 'Granularité temporelle',
    enum: ['hour', 'day', 'week', 'month']
  })
  @IsOptional()
  @IsString()
  granularity?: 'hour' | 'day' | 'week' | 'month' = 'day';
}

/**
 * ================================
 * DTOs DE VALIDATION SPÉCIALISÉS
 * ================================
 */

/**
 * DTO pour la validation AML
 */
export class AMLValidationDto {
  @ApiProperty({ description: 'ID de la transaction à valider' })
  @IsUUID('4')
  @IsNotEmpty()
  transactionId!: string;

  @ApiPropertyOptional({ description: 'Notes de validation' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiProperty({ description: 'Validation approuvée' })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ description: 'Niveau de risque attribué' })
  @IsOptional()
  @IsEnum(AMLRiskLevel)
  assignedRiskLevel?: AMLRiskLevel;
}

/**
 * DTO pour le traitement par lot
 */
export class BulkTransactionProcessDto {
  @ApiProperty({ type: [String], description: 'IDs des transactions' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  transactionIds!: string[];

  @ApiProperty({ enum: UnifiedTransactionStatus })
  @IsEnum(UnifiedTransactionStatus)
  @IsNotEmpty()
  newStatus!: UnifiedTransactionStatus;

  @ApiPropertyOptional({ description: 'Raison du traitement' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

/**
 * ================================
 * HELPERS DE CONVERSION
 * ================================
 */

/**
 * Helper pour convertir les DTOs legacy vers les nouveaux DTOs
 */
export class DtoConversionHelper {
  
  /**
   * Convertit les données customer-service vers CreateUnifiedTransactionDto
   */
  static fromCustomerPayment(data: any): CreateUnifiedTransactionDto {
    return {
      type: UnifiedTransactionType.PAYMENT,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.method,
      channel: TransactionChannel.WEB,
      description: data.description,
      serviceContext: ServiceContext.CUSTOMER,
      extendedMetadata: {
        customerId: data.customerId,
        invoiceId: data.invoiceId,
        subscriptionId: data.subscriptionId,
        planId: data.planId
      }
    };
  }
  
  /**
   * Convertit les données payment-service vers CreateUnifiedTransactionDto
   */
  static fromPaymentService(data: any): CreateUnifiedTransactionDto {
    return {
      type: UnifiedTransactionType.PAYMENT,
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      currency: data.currency,
      paymentMethod: UnifiedPaymentMethod.MOBILE_MONEY, // Default pour SerdiPay
      channel: TransactionChannel.API,
      priority: TransactionPriority.HIGH,
      serviceContext: ServiceContext.PAYMENT,
      extendedMetadata: {
        providerId: data.provider,
        providerName: data.provider,
        providerTransactionId: data.providerTransactionId,
        sessionId: data.sessionId,
        clientPhone: data.clientPhone,
        telecom: data.telecom,
        clientReference: data.clientReference
      }
    };
  }
}

export default {
  // DTOs Unifiés Core
  CreateUnifiedTransactionDto,
  UpdateTransactionStatusDto,
  UpdateUnifiedTransactionDto,
  UnifiedTransactionResponseDto,
  
  // DTOs par Service Legacy (Compatibilité)
  CreateCustomerPaymentDto,
  CreatePaymentServiceTransactionDto,
  CreateCommercialTransactionDto,
  CreateAdminFinanceDto,
  CreatePortfolioDisbursementDto,
  
  // DTOs Analytics et Reporting
  ServicePerformanceReportDto,
  CrossServiceAnalyticsDto,
  
  // DTOs Support
  TransactionFilterDto,
  PaginationDto,
  PaginatedTransactionResponseDto,
  AMLValidationDto,
  BulkTransactionProcessDto,
  DtoConversionHelper
};