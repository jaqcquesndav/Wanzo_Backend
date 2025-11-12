import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto, CoordinatesDto } from '../../shared';

export enum BranchType {
  MAIN = 'main',
  BRANCH = 'branch',
  ATM = 'atm',
  AGENT = 'agent',
  REPRESENTATIVE_OFFICE = 'representative_office'
}

export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_CONSTRUCTION = 'under_construction',
  TEMPORARILY_CLOSED = 'temporarily_closed'
}

/**
 * DTO pour les services disponibles dans une agence
 */
export class BranchServiceDto {
  @ApiProperty({ description: 'Code du service' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Nom du service' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description du service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Service disponible' })
  @IsBoolean()
  isAvailable!: boolean;

  @ApiPropertyOptional({ description: 'Horaires spécifiques pour ce service' })
  @IsOptional()
  @IsString()
  specificHours?: string;
}

/**
 * DTO pour les créneaux horaires
 */
export class TimeSlotDto {
  @ApiProperty({ description: 'Heure d\'ouverture (HH:mm)' })
  @IsString()
  open!: string;

  @ApiProperty({ description: 'Heure de fermeture (HH:mm)' })
  @IsString()
  close!: string;
}

/**
 * DTO pour les horaires d'ouverture
 */
export class OperatingHoursDto {
  @ApiPropertyOptional({ description: 'Horaires du lundi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  monday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du mardi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  tuesday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du mercredi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  wednesday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du jeudi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  thursday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du vendredi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  friday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du samedi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  saturday?: TimeSlotDto[];

  @ApiPropertyOptional({ description: 'Horaires du dimanche' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  sunday?: TimeSlotDto[];
}

/**
 * DTO pour les informations de contact d'une agence
 */
export class BranchContactDto {
  @ApiPropertyOptional({ description: 'Téléphone de l\'agence' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email de l\'agence' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Fax' })
  @IsOptional()
  @IsString()
  fax?: string;
}

/**
 * DTO pour les informations du manager d'agence
 */
export class BranchManagerDto {
  @ApiProperty({ description: 'Nom du manager' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Email du manager' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone du manager' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Poste/titre' })
  @IsOptional()
  @IsString()
  title?: string;
}

/**
 * DTO pour les données d'agence
 */
export class InstitutionBranchDataDto {
  @ApiProperty({ description: 'Nom de l\'agence' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Code unique de l\'agence' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Type d\'agence', enum: BranchType })
  @IsEnum(BranchType)
  type!: BranchType;

  @ApiProperty({ description: 'Statut de l\'agence', enum: BranchStatus })
  @IsEnum(BranchStatus)
  status!: BranchStatus;

  @ApiProperty({ description: 'Adresse de l\'agence' })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiPropertyOptional({ description: 'Coordonnées géographiques' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({ description: 'Informations de contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BranchContactDto)
  contact?: BranchContactDto;

  @ApiPropertyOptional({ description: 'Informations du manager' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BranchManagerDto)
  manager?: BranchManagerDto;

  @ApiPropertyOptional({ description: 'Services disponibles' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchServiceDto)
  services?: BranchServiceDto[];

  @ApiPropertyOptional({ description: 'Horaires d\'ouverture' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;

  @ApiPropertyOptional({ description: 'Notes et observations' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO principal pour une agence
 */
export class BranchDto extends InstitutionBranchDataDto {
  @ApiProperty({ description: 'Nom de l\'agence' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Code unique de l\'agence' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Type d\'agence', enum: BranchType })
  @IsEnum(BranchType)
  type!: BranchType;

  @ApiProperty({ description: 'Statut de l\'agence', enum: BranchStatus })
  @IsEnum(BranchStatus)
  status!: BranchStatus;

  @ApiProperty({ description: 'Adresse de l\'agence' })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiPropertyOptional({ description: 'Coordonnées géographiques' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({ description: 'Informations de contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BranchContactDto)
  contact?: BranchContactDto;

  @ApiPropertyOptional({ description: 'Informations du manager' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BranchManagerDto)
  manager?: BranchManagerDto;

  @ApiPropertyOptional({ description: 'Nombre d\'employés' })
  @IsOptional()
  @IsNumber()
  staffCount?: number;

  @ApiPropertyOptional({ description: 'Services disponibles' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchServiceDto)
  services?: BranchServiceDto[];

  @ApiPropertyOptional({ description: 'Horaires d\'ouverture' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours?: OperatingHoursDto;

  @ApiPropertyOptional({ description: 'Date d\'ouverture' })
  @IsOptional()
  @IsString()
  openingDate?: string;

  @ApiPropertyOptional({ description: 'Date de fermeture (si applicable)' })
  @IsOptional()
  @IsString()
  closingDate?: string;

  @ApiPropertyOptional({ description: 'Surface en m²' })
  @IsOptional()
  @IsNumber()
  floorArea?: number;

  @ApiPropertyOptional({ description: 'Nombre de guichets' })
  @IsOptional()
  @IsNumber()
  numberOfCounters?: number;

  @ApiPropertyOptional({ description: 'Nombre de DAB/ATM' })
  @IsOptional()
  @IsNumber()
  numberOfATMs?: number;

  @ApiPropertyOptional({ description: 'Parking disponible' })
  @IsOptional()
  @IsBoolean()
  hasParkingSpace?: boolean;

  @ApiPropertyOptional({ description: 'Accessibilité PMR' })
  @IsOptional()
  @IsBoolean()
  isAccessible?: boolean;

  @ApiPropertyOptional({ description: 'Sécurité renforcée' })
  @IsOptional()
  @IsBoolean()
  hasEnhancedSecurity?: boolean;

  @ApiPropertyOptional({ description: 'Notes et observations' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO pour créer une agence d'institution
 */
export class CreateInstitutionBranchDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données de l\'agence' })
  @ValidateNested()
  @Type(() => InstitutionBranchDataDto)
  branch!: InstitutionBranchDataDto;
}

/**
 * DTO pour créer une agence
 */
export class CreateBranchDto {
  @ApiProperty({ description: 'ID de l\'institution financière' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Données de l\'agence' })
  @ValidateNested()
  @Type(() => BranchDto)
  branch!: BranchDto;
}

/**
 * DTO pour mettre à jour une agence d'institution
 */
export class UpdateInstitutionBranchDto {
  @ApiProperty({ description: 'ID de l\'agence à mettre à jour' })
  @IsString()
  branchId!: string;

  @ApiProperty({ description: 'Nouvelles données de l\'agence' })
  @ValidateNested()
  @Type(() => InstitutionBranchDataDto)
  branch!: Partial<InstitutionBranchDataDto>;
}

/**
 * DTO pour mettre à jour une agence
 */
export class UpdateBranchDto {
  @ApiProperty({ description: 'ID de l\'agence à mettre à jour' })
  @IsString()
  branchId!: string;

  @ApiProperty({ description: 'Nouvelles données de l\'agence' })
  @ValidateNested()
  @Type(() => BranchDto)
  branch!: Partial<BranchDto>;
}

/**
 * DTO de réponse pour une agence d'institution
 */
export class InstitutionBranchResponseDto extends InstitutionBranchDataDto {
  @ApiProperty({ description: 'Identifiant unique de l\'agence' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID de l\'institution mère' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO de réponse pour une agence
 */
export class BranchResponseDto extends BranchDto {
  @ApiProperty({ description: 'Identifiant unique de l\'agence' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'ID de l\'institution mère' })
  @IsString()
  institutionId!: string;

  @ApiProperty({ description: 'Date de création' })
  @IsString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de mise à jour' })
  @IsString()
  updatedAt!: string;
}

/**
 * DTO pour les statistiques d'agence
 */
export class BranchStatsDto {
  @ApiProperty({ description: 'ID de l\'agence' })
  @IsString()
  branchId!: string;

  @ApiProperty({ description: 'Nombre de clients actifs' })
  @IsNumber()
  activeCustomers!: number;

  @ApiProperty({ description: 'Volume des transactions mensuelles' })
  @IsNumber()
  monthlyTransactionVolume!: number;

  @ApiProperty({ description: 'Nombre de comptes ouverts ce mois' })
  @IsNumber()
  newAccountsThisMonth!: number;

  @ApiProperty({ description: 'Satisfaction client (score sur 5)' })
  @IsNumber()
  customerSatisfactionScore!: number;

  @ApiPropertyOptional({ description: 'Dernière mise à jour des stats' })
  @IsOptional()
  @IsString()
  lastUpdated?: string;
}