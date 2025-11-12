import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  AddressDto, 
  ApiResponseDto, 
  ApiErrorResponseDto, 
  PaginationDto,
  InstitutionType, 
  InstitutionCategory,
  CurrencyType,
  RegulatoryStatus
} from '../../shared';

/**
 * DTO pour l'adresse du siège social - spécialisé pour les institutions financières
 */
export class HeadquartersAddressDto extends AddressDto {
  @ApiPropertyOptional({ description: 'Région administrative' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Zone économique' })
  @IsOptional()
  @IsString()
  economicZone?: string;
}

/**
 * DTO pour les contacts généraux
 */
export class GeneralContactDto {
  @ApiProperty({ description: 'Email principal' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Téléphone principal' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: 'Téléphone alternatif' })
  @IsOptional()
  @IsString()
  alternativePhone?: string;
}

/**
 * DTO pour les contacts du service client
 */
export class CustomerServiceContactDto {
  @ApiProperty({ description: 'Email service client' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Téléphone service client' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: 'Horaires d\'ouverture' })
  @IsOptional()
  @IsString()
  hours?: string;
}

/**
 * DTO pour les contacts relations investisseurs
 */
export class InvestorRelationsContactDto {
  @ApiProperty({ description: 'Email relations investisseurs' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Téléphone relations investisseurs' })
  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * DTO pour tous les contacts
 */
export class ContactsDto {
  @ApiProperty({ description: 'Contacts généraux' })
  @ValidateNested()
  @Type(() => GeneralContactDto)
  general!: GeneralContactDto;

  @ApiPropertyOptional({ description: 'Contacts service client' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerServiceContactDto)
  customerService?: CustomerServiceContactDto;

  @ApiPropertyOptional({ description: 'Contacts relations investisseurs' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvestorRelationsContactDto)
  investorRelations?: InvestorRelationsContactDto;
}

/**
 * DTO pour les informations du CEO
 */
export class CeoDto {
  @ApiProperty({ description: 'Nom complet du CEO' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Genre' })
  @IsEnum(['male', 'female', 'other'])
  gender!: 'male' | 'female' | 'other';

  @ApiPropertyOptional({ description: 'Biographie' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Éducation' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Expérience professionnelle' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ description: 'Spécialisations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({ description: 'URL de la photo' })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile' })
  @IsOptional()
  @IsString()
  linkedinProfile?: string;
}

/**
 * DTO pour les services offerts
 */
export class ServicesDto {
  @ApiPropertyOptional({ description: 'Services bancaires particuliers' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalBanking?: string[];

  @ApiPropertyOptional({ description: 'Services bancaires entreprises' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessBanking?: string[];

  @ApiPropertyOptional({ description: 'Services spécialisés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializedServices?: string[];
}

/**
 * DTO pour la conformité réglementaire
 */
export class RegulatoryComplianceDto {
  @ApiProperty({ description: 'Conformité BCC' })
  @IsBoolean()
  bcc!: boolean;

  @ApiPropertyOptional({ description: 'Conformité internationale' })
  @IsOptional()
  @IsBoolean()
  international?: boolean;

  @ApiPropertyOptional({ description: 'Conformité anti-blanchiment' })
  @IsOptional()
  @IsBoolean()
  aml?: boolean;
}

/**
 * DTO pour les informations financières
 */
export class FinancialInfoDto {
  @ApiProperty({ description: 'Total des actifs' })
  @IsNumber()
  assets!: number;

  @ApiProperty({ description: 'Capital social' })
  @IsNumber()
  capital!: number;

  @ApiProperty({ description: 'Devise' })
  @IsEnum(CurrencyType)
  currency!: CurrencyType;

  @ApiProperty({ description: 'Année de fondation' })
  @IsNumber()
  yearFounded!: number;

  @ApiProperty({ description: 'Conformité réglementaire' })
  @ValidateNested()
  @Type(() => RegulatoryComplianceDto)
  regulatoryCompliance!: RegulatoryComplianceDto;
}

/**
 * DTO pour la notation de crédit
 */
export class CreditRatingDto {
  @ApiProperty({ description: 'Agence de notation' })
  @IsString()
  agency!: string;

  @ApiProperty({ description: 'Note attribuée' })
  @IsString()
  rating!: string;

  @ApiProperty({ description: 'Perspective' })
  @IsEnum(['positive', 'stable', 'negative'])
  outlook!: 'positive' | 'stable' | 'negative';

  @ApiProperty({ description: 'Dernière mise à jour' })
  @IsDateString()
  lastUpdated!: string;
}

/**
 * DTO pour les liens d'applications
 */
export class AppLinksDto {
  @ApiPropertyOptional({ description: 'Lien Google Play Store' })
  @IsOptional()
  @IsString()
  android?: string;

  @ApiPropertyOptional({ description: 'Lien Apple App Store' })
  @IsOptional()
  @IsString()
  ios?: string;
}

/**
 * DTO pour la présence digitale
 */
export class DigitalPresenceDto {
  @ApiPropertyOptional({ description: 'Banking mobile disponible' })
  @IsOptional()
  @IsBoolean()
  hasMobileBanking?: boolean;

  @ApiPropertyOptional({ description: 'Internet banking disponible' })
  @IsOptional()
  @IsBoolean()
  hasInternetBanking?: boolean;

  @ApiPropertyOptional({ description: 'Liens des applications' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppLinksDto)
  appLinks?: AppLinksDto;
}

/**
 * DTO pour les couleurs de marque
 */
export class BrandColorsDto {
  @ApiPropertyOptional({ description: 'Couleur primaire' })
  @IsOptional()
  @IsString()
  primary?: string;

  @ApiPropertyOptional({ description: 'Couleur secondaire' })
  @IsOptional()
  @IsString()
  secondary?: string;

  @ApiPropertyOptional({ description: 'Couleur d\'accent' })
  @IsOptional()
  @IsString()
  accent?: string;
}

/**
 * DTO principal pour créer une institution financière
 */
export class CreateFinancialInstitutionDto {
  @ApiProperty({ description: 'Nom de l\'institution' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Type d\'institution', enum: InstitutionType })
  @IsOptional()
  @IsEnum(InstitutionType)
  type?: InstitutionType;

  @ApiProperty({ description: 'Catégorie d\'institution', enum: InstitutionCategory })
  @IsOptional()
  @IsEnum(InstitutionCategory)
  category?: InstitutionCategory;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Numéro d\'agrément' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Date d\'établissement' })
  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @ApiPropertyOptional({ description: 'Statut réglementaire', enum: RegulatoryStatus })
  @IsOptional()
  @IsEnum(RegulatoryStatus)
  regulatoryStatus?: RegulatoryStatus;

  @ApiPropertyOptional({ description: 'Date d\'expiration de licence' })
  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @ApiPropertyOptional({ description: 'Adresse du siège social' })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeadquartersAddressDto)
  address?: HeadquartersAddressDto;

  @ApiProperty({ description: 'Contacts' })
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts!: ContactsDto;

  @ApiPropertyOptional({ description: 'Informations CEO' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CeoDto)
  leadership?: CeoDto;

  @ApiPropertyOptional({ description: 'Services offerts' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServicesDto)
  services?: ServicesDto;

  @ApiPropertyOptional({ description: 'Informations financières' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financialInfo?: FinancialInfoDto;

  @ApiPropertyOptional({ description: 'Notation de crédit' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditRatingDto)
  creditRating?: CreditRatingDto;

  @ApiPropertyOptional({ description: 'Présence digitale' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalPresenceDto)
  digitalPresence?: DigitalPresenceDto;

  @ApiPropertyOptional({ description: 'Couleurs de marque' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandColorsDto)
  brandColors?: BrandColorsDto;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Site web' })
  @IsOptional()
  @IsString()
  website?: string;
}

/**
 * DTO pour mettre à jour une institution financière
 */
export class UpdateFinancialInstitutionDto extends PartialType(CreateFinancialInstitutionDto) {}

/**
 * DTO de réponse pour une institution financière
 */
export class FinancialInstitutionResponseDto {
  @ApiProperty({ description: 'Identifiant unique' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Nom de l\'institution' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Type d\'institution', enum: InstitutionType })
  @IsEnum(InstitutionType)
  type!: InstitutionType;

  @ApiProperty({ description: 'Catégorie d\'institution', enum: InstitutionCategory })
  @IsEnum(InstitutionCategory)
  category!: InstitutionCategory;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Numéro d\'agrément' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Date d\'établissement' })
  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @ApiProperty({ description: 'Statut réglementaire', enum: RegulatoryStatus })
  @IsEnum(RegulatoryStatus)
  regulatoryStatus!: RegulatoryStatus;

  @ApiPropertyOptional({ description: 'Date d\'expiration de licence' })
  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @ApiPropertyOptional({ description: 'Adresse du siège social' })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeadquartersAddressDto)
  address?: HeadquartersAddressDto;

  @ApiProperty({ description: 'Contacts' })
  @ValidateNested()
  @Type(() => ContactsDto)
  contacts!: ContactsDto;

  @ApiPropertyOptional({ description: 'Informations CEO' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CeoDto)
  leadership?: CeoDto;

  @ApiPropertyOptional({ description: 'Services offerts' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServicesDto)
  services?: ServicesDto;

  @ApiPropertyOptional({ description: 'Informations financières' })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financialInfo?: FinancialInfoDto;

  @ApiPropertyOptional({ description: 'Notation de crédit' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditRatingDto)
  creditRating?: CreditRatingDto;

  @ApiPropertyOptional({ description: 'Capacité financière' })
  @IsOptional()
  capaciteFinanciere?: {
    capitalSocial?: number;
    fondsPropresDeclares?: number;
    limitesOperationnelles?: string[];
    monnaieReference?: CurrencyType;
  };

  @ApiPropertyOptional({ description: 'Présence digitale' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalPresenceDto)
  digitalPresence?: DigitalPresenceDto;

  @ApiPropertyOptional({ description: 'Couleurs de marque' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandColorsDto)
  brandColors?: BrandColorsDto;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Site web' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Date de création' })
  @IsDateString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsDateString()
  updatedAt!: string;

  @ApiPropertyOptional({ description: 'Créé par' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

// ===== ALIAS POUR COMPATIBILITÉ CONTRÔLEUR =====

/**
 * Alias pour les DTOs requis par le contrôleur
 */
export type InstitutionCoreDataDto = CreateFinancialInstitutionDto;
export type CreateInstitutionCoreDto = CreateFinancialInstitutionDto;
export type UpdateInstitutionCoreDto = UpdateFinancialInstitutionDto;
export type InstitutionCoreResponseDto = FinancialInstitutionResponseDto;

/**
 * Enum pour le statut de l'institution
 */
export enum InstitutionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  REVOKED = 'revoked'
}

/**
 * Enum pour les types de licences
 */
export enum LicenseType {
  BANKING = 'banking',
  MICROFINANCE = 'microfinance',
  INSURANCE = 'insurance',
  PAYMENT = 'payment',
  FOREX = 'forex',
  INVESTMENT = 'investment',
  OTHER = 'other'
}

/**
 * Export du InstitutionType depuis shared pour réexportation
 */
export { InstitutionType } from '../../shared';