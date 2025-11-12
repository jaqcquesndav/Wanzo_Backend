import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTOs basés sur la documentation ENDPOINTS_EXACT.md et 04-company.md
 * Source de vérité : Documentation officielle
 */

// Enums de base
export enum CompanySize {
  MICRO = 'micro',
  SMALL = 'small', 
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

/**
 * DTO principal Company (Conforme à la documentation)
 */
export class CompanyResponseDto {
  @ApiProperty({ description: 'Identifiant unique' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Nom de l\'entreprise' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Nom légal/raison sociale' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Description de l\'entreprise' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Secteur d\'activité' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Taille de l\'entreprise', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone de contact' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Site web' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Adresse principale' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Statut de l\'entreprise', enum: CompanyStatus })
  @IsEnum(CompanyStatus)
  status!: CompanyStatus;

  @ApiProperty({ description: 'Date de création' })
  @IsDateString()
  createdAt!: string;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @IsDateString()
  updatedAt!: string;
}

/**
 * DTO pour créer une entreprise (Conforme aux endpoints documentés)
 */
export class CreateCompanyDto {
  @ApiProperty({ description: 'Nom de l\'entreprise' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Nom légal/raison sociale' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Description de l\'entreprise' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Secteur d\'activité' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Taille de l\'entreprise', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone de contact' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Site web' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Adresse principale' })
  @IsOptional()
  @IsString()
  address?: string;
}

/**
 * DTO pour mettre à jour une entreprise
 */
export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Nom de l\'entreprise' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nom légal/raison sociale' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Description de l\'entreprise' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Secteur d\'activité' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Taille de l\'entreprise', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone de contact' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Site web' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Adresse principale' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'entreprise', enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}

/**
 * DTOs pour les endpoints spécialisés (Conforme à ENDPOINTS_EXACT.md)
 */

// Location/Localisation
export class CompanyLocationDto {
  @ApiProperty({ description: 'Nom de l\'emplacement' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Adresse de l\'emplacement' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ description: 'Type d\'emplacement' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Coordonnées latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Coordonnées longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

// Partner (Documentation dit "partners" pas "associates")
export class CompanyPartnerDto {
  @ApiProperty({ description: 'Nom du partenaire' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Email du partenaire' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Téléphone du partenaire' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Rôle du partenaire' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Pourcentage de participation' })
  @IsOptional()
  @IsNumber()
  ownershipPercentage?: number;
}

/**
 * DTOs pour la liste et filtres (Conforme aux endpoints GET /companies)
 */
export class CompanyListQueryDto {
  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Éléments par page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par secteur' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Filtrer par taille', enum: CompanySize })
  @IsOptional()
  @IsEnum(CompanySize)
  size?: CompanySize;

  @ApiPropertyOptional({ description: 'Filtrer par statut', enum: CompanyStatus })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ description: 'Tri (name:asc, createdAt:desc, etc.)' })
  @IsOptional()
  @IsString()
  sort?: string;
}

/**
 * Réponse paginée pour la liste des entreprises
 */
export class CompanyListResponseDto {
  @ApiProperty({ description: 'Liste des entreprises', type: [CompanyResponseDto] })
  data!: CompanyResponseDto[];

  @ApiProperty({ description: 'Métadonnées de pagination' })
  meta!: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}