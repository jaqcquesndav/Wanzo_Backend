import { IsString, IsEmail, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO commun pour les coordonnées géographiques
 * Utilisé par tous les types de clients
 */
export class CoordinatesDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

/**
 * DTO commun pour les adresses
 * Structure unifiée pour tous les types d'adresses
 */
export class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

/**
 * DTO commun pour les contacts de base
 * Structure unifiée pour les informations de contact
 */
export class BaseContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  altPhone?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

/**
 * DTO commun pour les emplacements/localisations
 * Utilisé par les entreprises et institutions
 */
export class LocationDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsOptional()
  @IsString()
  manager?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  openingHours?: string;
}